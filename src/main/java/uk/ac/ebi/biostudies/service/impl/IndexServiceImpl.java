package uk.ac.ebi.biostudies.service.impl;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.ReadContext;
import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.lucene.document.*;
import org.apache.lucene.facet.FacetField;
import org.apache.lucene.index.IndexOptions;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.Query;
import org.apache.lucene.util.BytesRef;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import uk.ac.ebi.biostudies.api.util.Constants;
import uk.ac.ebi.biostudies.api.util.analyzer.AttributeFieldAnalyzer;
import uk.ac.ebi.biostudies.api.util.parser.AbstractParser;
import uk.ac.ebi.biostudies.api.util.parser.ParserManager;
import uk.ac.ebi.biostudies.config.IndexConfig;
import uk.ac.ebi.biostudies.config.TaxonomyManager;
import uk.ac.ebi.biostudies.schedule.jobs.ReloadOntologyJob;
import uk.ac.ebi.biostudies.service.FacetService;
import uk.ac.ebi.biostudies.service.FileIndexService;
import uk.ac.ebi.biostudies.service.IndexService;
import uk.ac.ebi.biostudies.config.IndexManager;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.*;

import static org.apache.commons.lang.StringUtils.isNotBlank;
import static uk.ac.ebi.biostudies.api.util.Constants.*;

/**
 * Created by ehsan on 27/02/2017.
 */


@Service
@Scope("singleton")

public class IndexServiceImpl implements IndexService {

    public static final FieldType TYPE_NOT_ANALYZED = new FieldType();
    static {
        TYPE_NOT_ANALYZED.setIndexOptions(IndexOptions.DOCS_AND_FREQS_AND_POSITIONS);
        TYPE_NOT_ANALYZED.setTokenized(false);
        TYPE_NOT_ANALYZED.setStored(true);
    }

    private Logger logger = LogManager.getLogger(IndexServiceImpl.class.getName());
    private static  BlockingQueue<String> indexFileQueue;

    @Autowired
    IndexConfig indexConfig;

    @Autowired
    IndexManager indexManager;

    @Autowired
    FileIndexService fileIndexService;

    @Autowired
    TaxonomyManager taxonomyManager;

    @Autowired
    FacetService facetService;

    @Autowired
    ReloadOntologyJob reloadOntologyJob;

    @Autowired
    ParserManager parserManager;

    @PostConstruct
    public void init(){
        indexFileQueue = new LinkedBlockingQueue<>();
        reloadOntologyJob.doExecute();
    }

    @Override
    public void indexAll(String fileName, boolean removeFileDocuments) throws IOException {
        String inputStudiesFilePath = getCopiedSourceFile(fileName);

        Long startTime = System.currentTimeMillis();
        ExecutorService executorService = new ThreadPoolExecutor(indexConfig.getThreadCount(), indexConfig.getThreadCount(),
                60, TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(indexConfig.getQueueSize()), new ThreadPoolExecutor.CallerRunsPolicy());

        int counter = 0;
        try (InputStreamReader inputStreamReader = new InputStreamReader(new FileInputStream(inputStudiesFilePath), "UTF-8")) {
            JsonFactory factory = new JsonFactory();
            JsonParser parser = factory.createParser(inputStreamReader);


            JsonToken token = parser.nextToken();
            while (!JsonToken.START_ARRAY.equals(token)) {
                token = parser.nextToken();
            }

            ObjectMapper mapper = new ObjectMapper();
            while (true) {
                token = parser.nextToken();
                if (!JsonToken.START_OBJECT.equals(token)) {
                    break;
                }
                if (token == null) {
                    break;
                }

                JsonNode submission = mapper.readTree(parser);
                executorService.execute(new JsonDocumentIndexer(submission, taxonomyManager, indexManager, fileIndexService, removeFileDocuments, parserManager));
                if(++counter % 10000==0) {
                    logger.info("{} docs indexed", counter);
                }
            }
            Map<String,String> commitData = new HashMap<>();
            while(token!=JsonToken.END_OBJECT){
                if(token.name().equalsIgnoreCase("field_name")) {
                    String key = parser.getText();
                    token = parser.nextToken();
                    commitData.put(key,token.isNumeric() ? Long.toString(parser.getLongValue()) : parser.getText());

                }
                token = parser.nextToken();
            }

            indexManager.getIndexWriter().setLiveCommitData(commitData.entrySet());
            executorService.shutdown();
            executorService.awaitTermination(5, TimeUnit.HOURS);
            taxonomyManager.commitTaxonomy();
            indexManager.getIndexWriter().commit();
            indexManager.refreshIndexSearcherAndReader();
            taxonomyManager.refreshTaxonomyReader();
            logger.info("Indexing lasted {} seconds", (System.currentTimeMillis()-startTime)/1000);
        }
        catch (Throwable error){
            logger.error("problem in parsing "+ fileName , error);
        } finally {
            logger.debug("Deleting temp file {}", inputStudiesFilePath);
            Files.delete(Paths.get(inputStudiesFilePath));
        }
    }

    @Override
    public void deleteDoc(String accession) throws Exception{
        if(accession==null || accession.isEmpty())
            return;
        QueryParser parser = new QueryParser(Fields.ACCESSION, new AttributeFieldAnalyzer());
        String strquery = Fields.ACCESSION+":"+accession;
        parser.setSplitOnWhitespace(true);
        Query query = parser.parse(strquery);
        indexManager.getIndexWriter().deleteDocuments(query);
        indexManager.getIndexWriter().commit();
        indexManager.refreshIndexSearcherAndReader();
    }

    @Override
    public void clearIndex(boolean commit) throws IOException {
        indexManager.getIndexWriter().deleteAll();
        indexManager.getIndexWriter().forceMergeDeletes();
        if(commit) {
            indexManager.getIndexWriter().commit();
            indexManager.refreshIndexSearcherAndReader();
        }
    }

    public synchronized String getCopiedSourceFile(String jsonFileName) throws IOException {
        File destFile = new File(System.getProperty("java.io.tmpdir"), jsonFileName);
        String sourceLocation = indexConfig.getStudiesInputFile();
        if (isNotBlank(sourceLocation)) {
            if (jsonFileName != null && !jsonFileName.isEmpty()) {
                sourceLocation = sourceLocation.replaceAll(STUDIES_JSON_FILE, jsonFileName);
            }
            File srcFile = new File(sourceLocation);
            logger.info("Making a local copy  of {} at {}", srcFile.getAbsolutePath(), destFile.getAbsolutePath());
            com.google.common.io.Files.copy(srcFile, destFile);
        }
        return destFile.getAbsolutePath();
    }

    public static class JsonDocumentIndexer implements Runnable {
        private Logger logger = LogManager.getLogger(JsonDocumentIndexer.class.getName());

        private IndexWriter writer;
        private JsonNode json;
        private TaxonomyManager taxonomyManager;
        private IndexManager indexManager;
        private FileIndexService fileIndexService;
        private boolean removeFileDocuments;
        private ParserManager parserManager;

        public JsonDocumentIndexer(JsonNode json,TaxonomyManager taxonomyManager, IndexManager indexManager, FileIndexService fileIndexService, boolean removeFileDocuments, ParserManager parserManager) {
            this.writer = indexManager.getIndexWriter();
            this.json = json;
            this.taxonomyManager = taxonomyManager;
            this.indexManager = indexManager;
            this.removeFileDocuments = removeFileDocuments;
            this.parserManager = parserManager;
            this.fileIndexService = fileIndexService;
        }

        @Override
        public void run(){
            Map<String, Object> valueMap = new HashMap<>();
            String accession="";
            try {
                parserManager.setParserContext(new HashMap<>());
                parserManager.setValueMap(valueMap);
                ReadContext jsonPathContext = JsonPath.parse(json.toString());

                accession = parserManager.getParserPool().get(Fields.ACCESSION).parse(valueMap, json, Fields.ACCESSION, null, jsonPathContext);
                parserManager.getParserPool().get(Fields.SECRET_KEY).parse(valueMap, json, accession,null, jsonPathContext);
                for(JsonNode fieldMetadataNode:indexManager.getIndexDetails().findValue(PUBLIC)){//parsing common "public" facet and fields
                    findParserAndParse(fieldMetadataNode, valueMap, accession, jsonPathContext);
                }
                if(valueMap.getOrDefault(Fields.TYPE,"").toString().equalsIgnoreCase("project"))//projects does not need more parsing
                {
                    updateDocument(valueMap);
                    return;
                }
                String projectName = valueMap.get(Facets.PROJECT).toString().toLowerCase();
                AbstractParser abstractParser = null;
                JsonNode projectSpecificFields = indexManager.getIndexDetails().findValue(projectName);
                if(projectSpecificFields != null) {
                    for (JsonNode fieldMetadataNode : projectSpecificFields) {//parsing project's facet and fields
                        abstractParser = findParserAndParse(fieldMetadataNode, valueMap, accession, jsonPathContext);//there exist a specific parser for this field
                        if (abstractParser == null) {
                            if (fieldMetadataNode.has(IndexEntryAttributes.JSON_PATH) && fieldMetadataNode.get(IndexEntryAttributes.FIELD_TYPE).asText().equalsIgnoreCase("facet"))//general facets with json path
                                abstractParser = parserManager.getParserPool().get("generalFacetWithPathParser");
                            else if (fieldMetadataNode.get(IndexEntryAttributes.FIELD_TYPE).asText().equalsIgnoreCase("facet"))//general facets with common json path
                                abstractParser = parserManager.getParserPool().get("generalFacetWithoutPathParser");
                            if (abstractParser != null) {
                                setProperties(abstractParser, fieldMetadataNode);//customize general parser for that specific facet with facet specific name
                                abstractParser.parse(valueMap, json, accession, fieldMetadataNode, jsonPathContext);
                            }
                        }
                    }
                }
                Set<String> columnSet = new LinkedHashSet<>();
                if(valueMap.get(Fields.TYPE).toString().equalsIgnoreCase("study")) {
                    Map fileValueMap = fileIndexService.indexSubmissionFiles((String) valueMap.get(Fields.ACCESSION), json, writer, columnSet, removeFileDocuments);
                    if (fileValueMap!=null) {
                        valueMap.putAll(fileValueMap);
                    }
                }
                valueMap.put(Constants.File.FILE_ATTS, columnSet);
                updateDocument(valueMap);

            }catch (Exception ex){
                logger.debug("problem in parser for parsing accession: {}!", accession, ex);
            }
        }

        private void setProperties(AbstractParser abstractParser, JsonNode fieldMetadataNode){
            String name = fieldMetadataNode.get(IndexEntryAttributes.NAME).asText();
            abstractParser.setIndexFieldKey(name);
            abstractParser.setJsonFieldKey(name);
            abstractParser.setToLowerCase(false);
        }

        private AbstractParser findParserAndParse(JsonNode fieldMetadataNode, Map<String, Object> valueMap, String accession, ReadContext jsonPathContext){
            AbstractParser abstrctParser = parserManager.getParserPool().get(fieldMetadataNode.get("name").asText());
            if(abstrctParser!=null)
                abstrctParser.parse(valueMap, json, accession, fieldMetadataNode, jsonPathContext);
            return abstrctParser;
        }

        private void updateDocument(Map<String, Object> valueMap) throws IOException {
            Document doc = new Document();

            //TODO: replace by classes if possible
            String value;
            String prjName = (String)valueMap.get(Facets.PROJECT);
            addFileAttributes(doc, (Set<String>) valueMap.get(Constants.File.FILE_ATTS));
            for (String field: indexManager.getProjectRelatedFields(prjName.toLowerCase())) {
                JsonNode curNode = indexManager.getAllValidFields().get(field);
                String fieldType = curNode.get(IndexEntryAttributes.FIELD_TYPE).asText();
                try{
                    switch (fieldType) {
                        case IndexEntryAttributes.FieldTypeValues.TOKENIZED_STRING:
                            value = String.valueOf(valueMap.get(field));
                            doc.add(new TextField(String.valueOf(field), value, Field.Store.YES));
                            break;
                        case IndexEntryAttributes.FieldTypeValues.UNTOKENIZED_STRING:
                            if (!valueMap.containsKey(field)) break;
                            value = String.valueOf(valueMap.get(field));
                            Field unTokenizeField = new Field(String.valueOf(field), value, TYPE_NOT_ANALYZED);
                            doc.add(unTokenizeField);
                            if(curNode.has (IndexEntryAttributes.SORTABLE) && curNode.get(IndexEntryAttributes.SORTABLE).asBoolean(false))
                                doc.add( new SortedDocValuesField(String.valueOf(field), new BytesRef( valueMap.get(field).toString())));
                            break;
                        case IndexEntryAttributes.FieldTypeValues.LONG:
                            if (!valueMap.containsKey(field) || StringUtils.isEmpty(valueMap.get(field).toString()) ) break;
                            doc.add(new SortedNumericDocValuesField(String.valueOf(field), (Long) valueMap.get(field)));
                            doc.add(new StoredField(String.valueOf(field), valueMap.get(field).toString()));
                            doc.add( new LongPoint(String.valueOf(field), (Long) valueMap.get(field)  ));
                            break;
                        case IndexEntryAttributes.FieldTypeValues.FACET:
                            addFacet(String.valueOf(valueMap.get(field)), field, doc, curNode);
                    }
                }catch(Exception ex){
                    logger.error("field name: {} doc accession: {}", field.toString(), String.valueOf(valueMap.get(Fields.ACCESSION)), ex);
                }


            }

            Document facetedDocument = taxonomyManager.getFacetsConfig().build(taxonomyManager.getTaxonomyWriter() ,doc);
            writer.updateDocument(new Term(Fields.ID, valueMap.get(Fields.ACCESSION).toString()), facetedDocument);

        }

        private void addFileAttributes(Document doc, Set<String> columnAtts){
            StringBuilder allAtts = new StringBuilder("Name|Size|");
            if(columnAtts==null)
                columnAtts = new HashSet<>();
            for(String att:columnAtts)
                allAtts.append(att).append("|");
            doc.add(new StringField(Constants.File.FILE_ATTS, allAtts.toString(),Field.Store.YES));
        }

        private void addFacet(String value, String fieldName, Document doc, JsonNode facetConfig){
            if(value==null || value.isEmpty()) {
                value = NA;
            }
            for(String subVal: org.apache.commons.lang3.StringUtils.split(value, Facets.DELIMITER)) {
                if(subVal.equalsIgnoreCase(NA) && facetConfig.has(IndexEntryAttributes.DEFAULT_VALUE)){
                    subVal = facetConfig.get(IndexEntryAttributes.DEFAULT_VALUE).textValue();
                }
                doc.add(new FacetField(fieldName, subVal.trim().toLowerCase()));
            }
        }
    }

    @Async
    public void processFileForIndexing() {
        logger.debug("Initializing File Queue for Indexing");
        while (true) {
            String filename = null;
            try {
                filename = indexFileQueue.take();
                logger.log(Level.INFO, "Started indexing {}. {} files left in the queue.", filename, indexFileQueue.size());
                boolean removeFileDocuments = true;
                if (filename == null || filename.isEmpty() || filename.equalsIgnoreCase(Constants.STUDIES_JSON_FILE) || filename.equalsIgnoreCase("default"))  {
                    clearIndex(false);
                    filename = Constants.STUDIES_JSON_FILE;
                    removeFileDocuments = false;
                }
                indexAll(filename, removeFileDocuments);
            } catch (Exception e) {
                e.printStackTrace();
                logger.log(Level.ERROR, e);
            }
            logger.log(Level.INFO, "Finished indexing {}", filename);
        }
    }

    public BlockingQueue<String> getIndexFileQueue() {
        return indexFileQueue;
    }

}

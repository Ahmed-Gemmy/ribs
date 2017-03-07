/*
 * Copyright 2009-2016 European Molecular Biology Laboratory
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package uk.ac.ebi.biostudies.efo;

import org.apache.lucene.index.Term;
import org.apache.lucene.search.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@Scope("singleton")
public class EFOQueryExpander {
    // logging machinery
    private final Logger logger = LoggerFactory.getLogger(getClass());

//    public BooleanQuery.Builder synonymBooleanBuilder = new BooleanQuery.Builder();
//    public BooleanQuery.Builder efoBooleanBuilder = new BooleanQuery.Builder();

    @Autowired
    EFOExpansionLookupIndex efoExpansionLookupIndex;


    public Query expand(Map<String, String> queryInfo, Query query, BooleanQuery.Builder synonymBooleanBuilder, BooleanQuery.Builder efoBooleanBuilder) throws IOException {
        Query result;

        if (query instanceof BooleanQuery) {
            BooleanQuery.Builder builder = new BooleanQuery.Builder();

            List<BooleanClause> clauses = ((BooleanQuery) query).clauses();
            for (BooleanClause c : clauses) {
                 builder.add(
                        expand(queryInfo, c.getQuery(), synonymBooleanBuilder, efoBooleanBuilder)
                        , c.getOccur()
                );
            }
            result = builder.build();
        } else if (query instanceof PrefixQuery || query instanceof WildcardQuery) {
            // we don't expand prefix or wildcard queries yet (because there are side-effects
            // we need to take care of first
            // for example, for prefix query will found multi-worded terms which, well, is wrong
            return query;
        } else {
            result = doExpand(queryInfo, query, synonymBooleanBuilder, efoBooleanBuilder);
        }
        return result;
    }

    private boolean isExpandable(String fieldName){
        return true;
    }
    private Query doExpand(Map<String, String> fieldsAndQueryInfo, Query query, BooleanQuery.Builder synonymBooleanBuilder, BooleanQuery.Builder efoBooleanBuilder) throws IOException {
        String field = getQueryField(query);
        if (null != field) {

//            if (env.fields.containsKey(field) && "string".equalsIgnoreCase(env.fields.get(field).type) && env.fields.get(field).shouldExpand) {
            if (fieldsAndQueryInfo.containsKey(field) && isExpandable(field)) {
                EFOExpansionTerms expansionTerms = efoExpansionLookupIndex.getExpansionTerms(query);
                if (1000 < expansionTerms.efo.size() + expansionTerms.synonyms.size()
                        && !fieldsAndQueryInfo.containsKey("expand")) {
                    fieldsAndQueryInfo.put("tooManyExpansionTerms","true");
                } else if (0 != expansionTerms.efo.size() || 0 != expansionTerms.synonyms.size()) {
                    BooleanQuery.Builder boolQueryBuilder = new BooleanQuery.Builder();
                    boolQueryBuilder.add(query, BooleanClause.Occur.SHOULD);

                    for (String term : expansionTerms.synonyms) {
                        Query synonymPart = newQueryFromString(term.trim(), field);
                        if (!queryPartIsRedundant(query, synonymPart)) {
                            synonymBooleanBuilder.add(synonymPart, BooleanClause.Occur.SHOULD);
                            boolQueryBuilder.add(synonymPart, BooleanClause.Occur.SHOULD);
                        }
                    }

                    for (String term : expansionTerms.efo) {
                        Query expansionPart = newQueryFromString(term.trim(), field);
                        efoBooleanBuilder.add(expansionPart, BooleanClause.Occur.SHOULD);
                        boolQueryBuilder.add(expansionPart, BooleanClause.Occur.SHOULD);
                    }

                    return boolQueryBuilder.build();
                }
            }
        }
        return query;
    }

    private String getQueryField(Query query) {
        String field = null;
        try {
            if (query instanceof PrefixQuery) {
                field = ((PrefixQuery) query).getPrefix().field();
            } else if (query instanceof WildcardQuery) {
                field = ((WildcardQuery) query).getTerm().field();
            } else if (query instanceof TermRangeQuery) {
                field = ((TermRangeQuery) query).getField();
            } else if (query instanceof FuzzyQuery) {
                field = ((FuzzyQuery) query).getTerm().field();
            } else if (query instanceof TermQuery) {
                field = ((TermQuery) query).getTerm().field();
            } else if (query instanceof PhraseQuery) {
                Term[] terms = ((PhraseQuery)query).getTerms();
                if (0 == terms.length) {
                    logger.error("No terms found for query [{}]", query.toString());
                    return null;
                }
                field = terms[0].field();
            } else {
                logger.error("Unsupported class [{}] for  query [{}]", query.getClass().getName(), query.toString());
                return null;
            }
        } catch (UnsupportedOperationException x) {
            logger.error("Query of [{}], class [{}] doesn't allow us to get its terms extracted", query.toString(), query.getClass().getCanonicalName());
        }

        return field;
    }

    public Query newQueryFromString(String text, String field) {
        if (text.contains(" ")) {
            String[] tokens = text.split("\\s+");
            PhraseQuery.Builder builder = new PhraseQuery.Builder();
            for (String token : tokens) {
                builder.add(new Term(field, token));
            }
            return builder.build();
        } else {
            return new TermQuery(new Term(field, text));
        }
    }

    private boolean queryPartIsRedundant(Query query, Query part) {
        Term partTerm = getFirstTerm(part);

        if (query instanceof PrefixQuery) {
            Term prefixTerm = ((PrefixQuery) query).getPrefix();
            return prefixTerm.field().equals(partTerm.field()) && (partTerm.text().startsWith(prefixTerm.text()));
        } else if (query instanceof WildcardQuery) {
            Term wildcardTerm = ((WildcardQuery) query).getTerm();
            String wildcard = "^" + wildcardTerm.text().replaceAll("\\?", "\\.").replaceAll("\\*", "\\.*") + "$";
            return wildcardTerm.field().equals(partTerm.field()) && (partTerm.text().matches(wildcard));
        } else {
            return query.toString().equals(part.toString());
        }

    }

    private Term getFirstTerm(Query query) {
        Term term = new Term("", "");
        if (query instanceof BooleanQuery) {
            List<BooleanClause> clauses = ((BooleanQuery)query).clauses();
            if (0 < clauses.size()) {
                return getFirstTerm(clauses.get(0).getQuery());
            } else {
                return term;
            }
        } else if (query instanceof PrefixQuery) {
            term = ((PrefixQuery) query).getPrefix();
        } else if (query instanceof WildcardQuery) {
            term = ((WildcardQuery) query).getTerm();
        } else if (query instanceof TermRangeQuery) {
            term = new Term(((TermRangeQuery) query).getField(), "");
        } else if (query instanceof FuzzyQuery) {
            term = ((FuzzyQuery) query).getTerm();
        } else if (query instanceof TermQuery) {
            term = ((TermQuery) query).getTerm();
        } else if (query instanceof PhraseQuery) {
            Term[] terms = ((PhraseQuery)query).getTerms();
            if (0 == terms.length) {
                logger.error("No terms found for query [{}]", query.toString());
                return term;
            }
            term = terms[0];
        } else {
            logger.error("Unsupported class [{}] for query [{}]", query.getClass().getName(), query.toString());
            return term;
        }
        return term;
    }
}
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

package uk.ac.ebi.biostudies.schedule.jobs;

import com.google.common.io.CharStreams;
import com.google.common.io.Files;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uk.ac.ebi.arrayexpress.utils.efo.EFOLoader;
import uk.ac.ebi.biostudies.api.util.EmailSender;
import uk.ac.ebi.biostudies.config.EFOConfig;
import uk.ac.ebi.biostudies.config.MailConfig;
import uk.ac.ebi.biostudies.efo.StringTools;
import uk.ac.ebi.biostudies.service.impl.efo.Ontology;


import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.charset.Charset;

@Service
public class UpdateOntologyJob{

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    Ontology ontology;
    @Autowired
    EFOConfig efoConfig;
    @Autowired
    ReloadOntologyJob reloadOntologyJob;
    @Autowired
    EmailSender emailSender;
    @Autowired
    MailConfig mailConfig;

    @Scheduled(cron = "${bs.efo.update}")
    public void doExecute() throws Exception {
        // check the version of EFO from update location; if newer, copy it
        // over to our location and launch a reload process
        String efoLocation = efoConfig.getEfoUrl();//getPreferences().getString("bs.efo.update.source");
        URI efoURI = new URI(efoLocation);
        logger.info("Checking EFO ontology version from [{}]", efoURI.toString());
        String version = EFOLoader.getOWLVersion(efoURI);
        String loadedVersion = null;
        if(ontology.getEfo()!=null)
            loadedVersion = ontology.getEfo().getVersionInfo();
        if (loadedVersion == null || (null != version
                && !version.equals(loadedVersion)
                && isVersionNewer(version, loadedVersion))

                ) {
            // we have newer version, let's fetch it and copy it over to our working location
            logger.info("Updating EFO with version [{}]", version);
            try (InputStream is = efoURI.toURL().openStream()) {
                File efoFile = new File(efoConfig.getEfoLocation());
                Files.write(CharStreams.toString(new InputStreamReader(is, "UTF-8")),
                        efoFile, Charset.forName("UTF-8"));
                emailSender.send(mailConfig.getReportsRecipients(),
                        mailConfig.getHiddenRecipients()
                        , "EFO update"
                        , "Experimental Factor Ontology has been updated to version [" + version + "]" + StringTools.EOL
                                + StringTools.EOL
                                + "Application [${variable.appname}]" + StringTools.EOL
                                + "Host [${variable.hostname}]" + StringTools.EOL,
                        mailConfig.getReportsOriginator()
                );
                reloadOntologyJob.doExecute();
            }

        } else {
//            logger.info("Current ontology version [{}] is up-to-date", loadedVersion);
        }
    }

    private boolean isVersionNewer(String version, String baseVersion) {
        return null != version
                && null != baseVersion
                && Float.parseFloat("0." + version.replace(".", "")) > Float.parseFloat("0." + baseVersion.replace(".", ""));
    }
}

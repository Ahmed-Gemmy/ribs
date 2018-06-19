var DetailRenderer = (function () {
    var detailRenderer = {},
        selectedFilesCount = 0,
        totalRows = 0,
        expansionSource,
        generatedID = 0,
        lastExpandedTable,
        orgOrder= [],
        linkMap = {
            'pmc':'https://europepmc.org/articles/{0}',
            'pmid':'https://europepmc.org/abstract/MED/{0}',
            'doi':'https://dx.doi.org/{0}',
            'chembl':'https://www.ebi.ac.uk/chembldb/compound/inspect/{0}',
            'ega':'https://www.ebi.ac.uk/ega/studies/{0}',
            'uniprot':'http://www.uniprot.org/uniprot/{0}',
            'ena':'https://www.ebi.ac.uk/ena/data/view/{0}',
            'arrayexpress files':'https://www.ebi.ac.uk/arrayexpress/experiments/{0}/files/',
            'arrayexpress':'https://www.ebi.ac.uk/arrayexpress/experiments/{0}',
            'dbsnp':'http://www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs={0}',
            'pdbe':'https://www.ebi.ac.uk/pdbe-srv/view/entry/{0}/summary',
            'pfam':'http://pfam.xfam.org/family/{0}',
            'omim':'http://omim.org/entry/{0}',
            'interpro':'https://www.ebi.ac.uk/interpro/entry/{0}',
            'nucleotide':'http://www.ncbi.nlm.nih.gov/nuccore/{0}',
            'geo':'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={0}',
            'intact':'https://www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc={0}',
            'biostudies': contextPath +'/studies/{0}',
            'biostudies title': contextPath+'/studies?first&query=title%3A%22{0}%22',
            'biostudies search': contextPath+'/studies?query={0}',
            'go':'http://amigo.geneontology.org/amigo/term/{0}',
            'chebi':'https://www.ebi.ac.uk/chebi/searchId.do?chebiId={0}',
            'bioproject':'https://www.ncbi.nlm.nih.gov/bioproject/{0}',
            'biosamples':'https://www.ebi.ac.uk/biosamples/samples/{0}',
            'chemagora':'http://chemagora.jrc.ec.europa.eu/chemagora/inchikey/{0}',
            'compound':'https://www.ebi.ac.uk/biostudies/studies/{0}',
            'rfam':'http://rfam.org/family/{0}',
            'rnacentral':'http://rnacentral.org/rna/{0}',
            'nct':'https://clinicaltrials.gov/ct2/show/{0}'
        },
        reverseLinkMap = {
            '^europepmc.org/articles/(.*)':'PMC',
            '^europepmc.org/abstract/MED/(.*)':'PMID',
            '^dx.doi.org/(.*)':'DOI',
            '^www.ebi.ac.uk/chembldb/compound/inspect/(.*)':'ChEMBL',
            '^www.ebi.ac.uk/ega/studies/(.*)':'EGA',
            '^www.uniprot.org/uniprot/(.*)':'Sprot',
            '^www.ebi.ac.uk/ena/data/view/(.*)':'ENA',
            '^www.ebi.ac.uk/arrayexpress/experiments/(.*)/files/':'ArrayExpress Files',
            '^www.ebi.ac.uk/arrayexpress/experiments/(.*)':'ArrayExpress',
            '^www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs=(.*)':'dbSNP',
            '^www.ebi.ac.uk/pdbe-srv/view/entry/(.*)/summary':'PDBe',
            '^pfam.xfam.org/family/(.*)':'Pfam',
            '^omim.org/entry/(.*)':'OMIM',
            '^www.ebi.ac.uk/interpro/entry/(.*)':'InterPro',
            '^www.ncbi.nlm.nih.gov/nuccore/(.*)':'RefSeq',
            '^www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=(.*)':'GEO',
            '^dx.doi.org/(.*)':'DOI',
            '^www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc=(.*)':'IntAct',
            '^www.ebi.ac.uk/biostudies/studies/(.*)':'BioStudies',
            '^www.ebi.ac.uk/biostudies/studies/search.html?query=(.*)':'BioStudies Search',
            '^amigo.geneontology.org/amigo/term/(.*)':'GO',
            '^www.ebi.ac.uk/chebi/searchId.do?chebiId=(.*)':'ChEBI',
            '^www.ncbi.nlm.nih.gov/bioproject/(.*)':'BioProject',
            '^www.ebi.ac.uk/biosamples/samples/(.*)':'BioSamples',
            '^rfam.org/family/(.*)':'Rfam',
            '^rnacentral.org/rna/(.*)':'RNAcentral',
            '^clinicaltrials.gov/ct2/show/(.*)':'nct'
        },
        linkTypeMap = { //sync with normalised-text
            'sprot': 'UniProt',
            'gen': 'ENA',
            'arrayexpress': 'ArrayExpress',
            'refsnp': 'dbSNP',
            'pdb': 'PDBe',
            'pfam': 'Pfam',
            'omim': 'OMIM',
            'interpro': 'InterPro',
            'refseq': 'Nucleotide',
            'ensembl': 'Ensembl',
            'doi': 'DOI',
            'intact': 'IntAct',
            'chebi': 'ChEBI',
            'ega': 'EGA',
            '': 'External',
            'bioproject': 'BioProject',
            'biosample': 'BioSamples',
            'compound':'Compound',
            'chemagora':'ChemAgora',
            'rfam':'Rfam',
            'rnacentral':'RNAcentral',
            'nct':'NCT'
        },
        projectScripts = [{regex: /E-MTAB-*/, script: 'ArrayExpress.js'}],
        params,
        template;

    detailRenderer.data = {},
    detailRenderer.sectionTables = [],
    detailRenderer.filesTable,
    detailRenderer.linksTable,

    detailRenderer.init = function(prms) {
        params = prms;
        this.registerHelpers();
        template = Handlebars.compile($('script#study-template').html());
    }


    detailRenderer.createMainFileTable = function() {
        totalRows = $("#file-list tbody tr").length;
        //if (!DetailRenderer.filesTable) return
        DetailRenderer.filesTable = $("#file-list").DataTable({
            "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
            "columnDefs": [{"targets": [0], "searchable": false, "orderable": false, "visible": true},
                //   {"targets": [2], "searchable": true, "orderable": false, "visible": false}
            ],
            "order": [[1, "asc"]],
            "dom": "rlftpi",
            "infoCallback": function (settings, start, end, max, total, out) {
                return (total == max) ? out : out + ' <a class="section-button" id="clear-filter" onclick="DetailRenderer.clearFileFilter();return false;">' +
                    '<span class="fa-layers fa-fw">'
                    + '<i class="fas fa-filter"></i>'
                    + '<span class="fa-layers-text" data-fa-transform="shrink-2 down-4 right-6">×</span>'
                    + '</span> show all files</a>';
            }
        });
    }


    detailRenderer.createBigFileTable = function (){
        $.ajax({url: "http://localhost:8080/biostudies/api/v1/headers/"+ DetailRenderer.data.accno, success: function(result){
                result.splice(0,0,{name: "x", title: "", searchable:true, type:"checkbox", visible: true, orderable:false, data: "",  render: function ( data, type, row ) {
                        return '<div class="file-check-box"><input type="checkbox" data-name="'+row.path+'"></input></div>';
                    }});
                DetailRenderer.filesTable= $('#file-list').DataTable({"processing": true,
                    "serverSide": true, "columns": result,
                    "columnDefs": [
                        {
                            targets:2,
                            render: function (data, type, row) {
                                return DetailRenderer.getByteString(data);
                            }
                        },
                        {
                            targets:1,
                            render: function (data, type, row) {
                                return '<a class="overflow-name-column" target="_blank" style="max-width: 500px;" title="'+data+'" onclick="DetailRenderer.closeFullScreen();" href="'+row.path+'">'+data+'</a>';
                            }
                        }
                    ],
                    ajax: {
                        url: '/biostudies/api/v1/filelist',
                        type: 'post',
                        data:{acc:DetailRenderer.data.accno, pageSize:10}
                    }
                });
                var head_item = DetailRenderer.filesTable.columns(0).header();
                $(head_item ).html('<input id="select-all-files"  type="checkbox"/>');

            }});
    }

    detailRenderer.registerHelpers = function() {
        Handlebars.registerHelper('find', function (key, keyval, val, obj) {
            var e = obj.filter(function (o) {
                return o[key] == keyval
            })[0];
            if (e != undefined) return new Handlebars.SafeString(e[val]);
        });
        Handlebars.registerHelper('valueWithName', function (val, obj) {
            if (obj == null) return;
            var e = obj.filter(function (o) {
                return o['name'] == val
            })[0];
            if (e == undefined) return '';
            $.each(e.valqual, function (i, v) {
                if (v.name == 'url') {
                    e.url = v.value;
                }
            });
            var urls = [];
            if (e.url) urls = e.url.indexOf(' | ') >= 0 ? e.url.split(' | ') : [e.url];
            var html = e.value.split(' | ').map(function (v, i) {
                return (urls[i] ? '<a href="'
                    + urls[i]
                    + (urls[i][0] != '#' ? '" target="_blank' : '')
                    + '">' + v + '</a>'
                    : v)
            })
                .join(', ')
            return new Handlebars.SafeString(html);
        });
        Handlebars.registerHelper('renderLinkTableRow', function (val, obj) {
            if (obj == null) return new Handlebars.SafeString('<td></td>');
            var e = obj.filter(function (o) {
                return o['name'] == val
            })[0];
            if (e == undefined) return new Handlebars.SafeString('<td></td>');
            var value = val.toLowerCase() == 'type' && linkTypeMap[e.value.toLowerCase()] ? linkTypeMap[e.value.toLowerCase()] : e.value;
            return new Handlebars.SafeString(e.url ?
                '<td' + (val == 'Section' && e.search ? ' data-search="' + e.search + '" ' : '') + '><a href="'
                + e.url
                + (e.url[0] != '#' ? '" target="_blank"' : '"')
                + (e.title ? ' title="' + e.title + '"' : '')
                + '>' + value + '</a></td>' : '<td>' + value + '</td>');
        });
        Handlebars.registerHelper('renderFileTableRow', function (val, obj, type) {
            if (obj == null) return new Handlebars.SafeString('<td></td>');
            var e = obj.filter(function (o) {
                return o['name'] == val
            })[0];
            if (e == undefined) {
                return new Handlebars.SafeString(val == 'Section' ? '<td data-search=""></td>' : '<td></td>');
            }
            return new Handlebars.SafeString('<td'
                + (e.sort ? ' data-sort="' + e.sort + '"' : '')
                + (val == 'Section' && e.search ? ' data-search="' + e.search + '" ' : '')
                + '>'
                + (e.url && type != 'directory' ? '<a onclick="closeFullScreen();" '
                        + 'href="' + e.url + (e.url[0] != '#' ? '" target="_blank' : '')
                        + '">'
                        + new Handlebars.SafeString(e.value)
                        + '</a>'
                        : e.value
                )
                + '</td>'
            );
        });
        Handlebars.registerHelper('ifHasAttribute', function (val, obj, options) {
            var ret = false;
            if (obj != null) {
                var e = obj.filter(function (o) {
                    return o['name'] == val
                })[0];
                ret = !(e == undefined);
            }
            return ret ? options.fn(this) : options.inverse(this);

        });
        Handlebars.registerHelper('section', function (o, shouldIndent) {
            var template = Handlebars.compile($('script#section-template').html());
            this.indentClass = (shouldIndent == 'true') ? 'indented-section' : '';
            return template(o);
        });
        Handlebars.registerHelper('table', function (o) {
            var template = Handlebars.compile($('script#section-table').html());
            return template(o);
        });
        Handlebars.registerHelper('ifArray', function (arr, options) {
            if (Array.isArray(arr)) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper('formatDate', function (v) {
            return (new Date(v)).toLocaleDateString("en-gb", {year: 'numeric', month: 'long', day: 'numeric'});
        });
        Handlebars.registerHelper('accToLink', function (val) {
            if (!val) return '';
            return DetailRenderer.accToLink(val);
        });
        Handlebars.registerHelper('ifRenderable', function (arr, options) {
            var specialSections = ['author', 'organization', 'organisation', 'funding', 'publication'];

            if (arr.type && $.inArray(arr.type.toLowerCase(), specialSections) < 0) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper('eachGroup', function (arr, options) {
            if (!arr) return;
            var mod = arr.reduce(function (r, i) {
                r[i.name] ? r[i.name].push(i) : r[i.name] = [i];
                return r;
            }, {});
            var ret = '';
            for (var k in mod) {
                ret = ret + options.fn(mod[k]);
            }
            return ret;
        });
        Handlebars.registerHelper('setHeaders', function () {
            var names = $.map(this, function (v) {
                return $.map(v.attributes, function (v) {
                    return v.name
                })
            })
            this.headers = Array.from(new Set(names));
            this.type = this[0].type
        });
        Handlebars.registerHelper('setFileTableHeaders', function (o) {
            if (this && this.length) {
                var names = ['Name', 'Size'];
                var hsh = {'Name': 1, 'Size': 1};
                $.each(this, function (i, file) {
                    file.attributes = file.attributes || [];
                    file.attributes.push({
                        "name": "Name",
                        "value": file.path.substring(file.path.lastIndexOf("/") + 1)
                    });
                    file.attributes.push({
                        "name": "Size",
                        "value": file.type == 'directory' ? '<i class="far fa-folder"></i>' : DetailRenderer.getByteString(file.size),
                        "sort": file.size
                    });
                    $.each(file.attributes, function (i, attribute) {
                        if (!(attribute.name in hsh)) {
                            names.push(attribute.name);
                            hsh[attribute.name] = 1;
                        }
                        // make file link
                        if (attribute.name == 'Name') {
                            attribute.url = contextPath + '/files/' + $('#accession').text() + '/' + file.path
                        }
                    })
                });
                if (names.indexOf("Section") >= 0) names.splice(2, 0, names.splice(names.indexOf("Section"), 1)[0]);
                this.headers = names.filter(function (name) {
                    return name.toLowerCase() != 'type'
                });
                this.type = this[0].type
            }
        });
        Handlebars.registerHelper('setLinkTableHeaders', function (o) {
            if (this && this.length) {
                var names = ['Name'];
                var hsh = {'Name': 1};
                $.each(this, function (i, v) {
                    v.attributes = v.attributes || [];
                    v.attributes.push({"name": "Name", "value": v.url});
                    $.each(v.attributes, function (i, v) {
                        if (!(v.name in hsh)) {
                            names.push(v.name);
                            hsh[v.name] = 1;
                        }
                    })
                });
                this.linkHeaders = names;
            }
        });
        Handlebars.registerHelper('main-file-table', function () {
            var o = DetailRenderer.data.section.files;
            var template = Handlebars.compile($('script#main-file-table').html());
            return template(o);
        });

        Handlebars.registerHelper('big-file-table', function() {
            var template = Handlebars.compile($('script#big-file-table').html());
            return template(DetailRenderer.data.section.files);
        });

        Handlebars.registerHelper('main-link-table', function (o) {
            var o = DetailRenderer.findall(this, 'links');
            var template = Handlebars.compile($('script#main-link-table').html());
            return template(o);
        });
        Handlebars.registerHelper('main-orcid-claimer', function (o, k) {
            var template = Handlebars.compile($('script#main-orcid-claimer').html());
            return template({accession: o.data.root.accno});
        });
        Handlebars.registerHelper('valquals', function (o) {
            var template = Handlebars.compile($('script#valqual-template').html());
            return template($(o).filter(function (i, q) {
                return q.name.toLowerCase() != 'url'
            }).toArray());
        });
        Handlebars.registerHelper('renderOntologySubAttribute', function (arr) {
            if (!arr) return;
            arr = arr.filter(function (o) {
                return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid']) >= 0
            })
            var ret = '';
            $.each(arr, function (i, o) {
                if (o.name.toLowerCase() == 'ontology') {
                    var termname = $.grep(arr, function (o, j) {
                        return j > i && o.name.toLowerCase() == 'termname'
                    })[0];
                    var termid = $.grep(arr, function (o, j) {
                        return j > i && o.name.toLowerCase() == 'termid'
                    })[0];
                    ret += '<span data-ontology="' + o.value + '" ' +
                        (termid ? 'data-term-id="' + termid.value + '" ' : '') +
                        (termname ? 'data-term-name="' + termname.value : '') +
                        '"></span>';
                }
            });
            return ret;
        });
        Handlebars.registerHelper('eachSubAttribute', function (arr, options) {
            if (!arr) return;
            return arr.filter(function (o) {
                return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid']) < 0
            }).map(function (o, i, filtered) {
                return options.fn(o, {data: {first: i == 0, last: i == (filtered.length - 1), index: i}})
            }).join('')
        });
        Handlebars.registerHelper('section-link-tables', function (o) {
            var template = Handlebars.compile($('script#section-link-tables').html());
            return template(o.data.root);
        });
        Handlebars.registerHelper('link-table', function (o) {
            var names = ['Name'];
            var hsh = {'Name': 1};
            $.each(o.links, function (i, v) {
                v.attributes = v.attributes || [];
                v.attributes.push({"name": "Name", "value": v.url});
                $.each(v.attributes, function (i, v) {
                    if (!(v.name in hsh)) {
                        names.push(v.name);
                        hsh[v.name] = 1;
                    }
                })
            });
            o.linkHeaders = names;
            var template = Handlebars.compile($('script#link-table').html());
            return template(o);
        });
        Handlebars.registerHelper('eachLinkTable', function (options) {
            var ret = '';
            var linkTables = findall(this, 'links', false);
            var data = Handlebars.createFrame(options.data);
            $.each(linkTables, function (i, linkTable) {
                data.first = i == 0, data.last = i == (linkTables.length - 1), data.index = i, data.indexPlusOne = i + 1;
                ret = ret + options.fn({links: $.isArray(linkTable) ? linkTable : [linkTable]}, {data: data});
            });
            return ret;
        });
        Handlebars.registerHelper('asString', function () {
            console.log(this)
            return this.name
        });
        Handlebars.registerHelper('eachAuthor', function (obj, options) {
            var ret = '';
            var orgs = {}

            // make an org map
            if (!obj.subsections) return '';

            $.each(obj.subsections.filter(function (o) {
                return o.type && (o.type.toLowerCase() == 'organization' || o.type.toLowerCase() == 'organisation');
            }), function (i, o) {
                var orgName = o.attributes ? o.attributes.filter(function (p) {
                    return p.name.toLowerCase() == 'name'
                }) : [{"value": ""}];
                orgs[o.accno] = orgName[0].value;
            });


            var orgNumber = 1;
            var orgToNumberMap = {}
            var authors = obj.subsections.filter(function (o) {
                return o.type && o.type.toLowerCase() == 'author';
            });
            $.each(authors, function (i, o) {
                var author = {}
                $.each(o.attributes, function (i, v) {
                    if (!author[v.name]) {
                        author[v.name] = v.value;
                    } else if ($.isArray(author[v.name])) {
                        author[v.name].push(v.value);
                    } else {
                        author[v.name] = [author[v.name], v.value];
                    }
                });
                if (author.affiliation) {
                    if ($.isArray(author.affiliation)) {
                        var affiliations = [];
                        $(author.affiliation).each(function (i, aff) {
                            if (!orgToNumberMap[aff]) {
                                orgToNumberMap[aff] = orgNumber++;
                                orgOrder.push(aff);
                            }
                            affiliations.push({org: aff, affiliationNumber: orgToNumberMap[aff]});
                        })
                        author.affiliation = affiliations;
                    } else {
                        if (!orgToNumberMap[author.affiliation]) {
                            orgToNumberMap[author.affiliation] = orgNumber++;
                            orgOrder.push(author.affiliation);
                        }
                        author.affiliationNumber = orgToNumberMap[author.affiliation];
                    }
                }
                var data = Handlebars.createFrame(options.data);
                data.first = i == 0, data.last = i == (authors.length - 1), data.index = i, data.left = authors.length - 10;
                ret += options.fn(author, {data: data});
            });
            return ret;
        });
        Handlebars.registerHelper('eachOrganization', function (obj, options) {
            var ret = '';
            var orgs = {};

            if (!obj.subsections) return '';

            // make an org map
            $.each(obj.subsections.filter(function (o) {
                return o.type && (o.type.toLowerCase() == 'organization' || o.type.toLowerCase() == 'organisation');
            }), function (i, o) {
                var orgName = o.attributes ? o.attributes.filter(function (p) {
                    return p.name.toLowerCase() == 'name'
                }) : [{"value": ""}];
                orgs[o.accno] = orgName[0].value;
            });

            $.each(orgOrder, function (i, v) {
                var data = Handlebars.createFrame(options.data);
                data.first = i == 0, data.last = i == (orgOrder.length - 1), data.index = i, data.left = orgOrder.length - 10;
                ret += options.fn({name: orgs[v], affiliationNumber: i + 1, affiliation: v}, {data: data});
            });
            return ret;
        });
        Handlebars.registerHelper('eachFunder', function (obj, options) {
            var ret = '';
            var orgs = {};
            if (!obj.subsections) return '';
            // make an org map
            $.each(obj.subsections.filter(function (subsection) {
                return subsection.type && subsection.type.toLowerCase() == 'funding';
            }), function (i, o) {
                var org = null, grant = '';
                $(o.attributes).each(function () {
                    if (this.name.toLowerCase() == 'agency') org = this.value;
                    if (this.name.toLowerCase() == 'grant_id') grant = this.value;
                });
                if (org) {
                    orgs[org] = (orgs[org]) ? orgs[org] + (", " + grant) : orgs[org] = grant;
                }
            });
            var keys = Object.keys(orgs), data = Handlebars.createFrame(options.data);
            $.each(keys, function (i, v) {
                data.first = i == 0, data.last = i == (keys.length - 1), data.index = i;
                ret += options.fn({name: v, grants: orgs[v]}, {data: data});
            });
            return ret;
        });
        Handlebars.registerHelper('renderPublication', function (obj, options) {
            var publication = {}
            if (!obj.subsections) return '';
            var pubs = obj.subsections.filter(function (o) {
                return o.type && o.type.toLowerCase() == 'publication';
            });
            if (!pubs || pubs.length < 1) return null;
            var template = Handlebars.compile($('script#publication-template').html());
            var html = '<div class="bs-name">Publication' + (pubs.length > 1 ? 's' : '') + '</div>';
            $.each(pubs, function (i, pub) {
                publication.URLs = [];
                $.each(pub.attributes, function (i, v) {
                    var name = v.name.toLowerCase().replace(' ', '_');
                    var url = DetailRenderer.getURL(v.value);
                    if (url) {
                        publication.URLs.push(url);
                    } else {
                        publication[name] = v.value
                    }
                });
                publication.accno = pubs.accno;
                if (publication.accno) {
                    var url = getURL(publication.accno);
                    if (url != null) {
                        if (/^\d+$/.test(publication.accno)) {
                            publication.URLs.push(getURL('PMID' + publication.accno));
                        } else {
                            publication.URLs.push(url);
                        }
                    }
                }
                $($.map(pub.links, function (v) {
                    return v;
                })).each(function (i, link) {
                    publication.URLs.push(DetailRenderer.getURL(link.url, link.attributes.filter(function (v, i) {
                        return v.name == 'Type';
                    })[0].value));
                });

                if (!publication.URLs.length) delete publication.URLs
                html += template(publication);
            });
            return new Handlebars.SafeString(html);
        });
        Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        });
    }

    detailRenderer.findall = function(obj, k, unroll) { // works only for files and links
        if (unroll == undefined) unroll = true
        var ret = [];
        for (var key in obj) {
            if (key === k) {
                if (!obj.root) {
                    var accno = obj.accno, type = obj['type'];
                    if (!accno) {
                        accno = obj.accno = 'genid' + generatedID++;
                    }
                    if (type == 'Publication') continue;
                    $.each(obj[k], function () {
                        $.each($.isArray(this) ? this : [this], function () {
                            if (accno && type != "Study") {
                                this.attributes = this.attributes || [];
                                var targetId = DetailRenderer.accToLink(accno);
                                this.attributes.splice(0, 0, {
                                    'name': 'Section',
                                    'search': targetId,
                                    'value': type,
                                    'url': '#' + targetId,
                                    'title': accno
                                });
                            }
                        });
                    });
                }
                $.merge(ret, obj[k]);
            } else if (typeof(obj[key]) == "object") {
                $.merge(ret, DetailRenderer.findall(obj[key], k, unroll));
            }
        }
        //unroll file tables
        if (unroll) {
            return $.map(ret, function (n) {
                return n;
            });
        }
        return ret;
    }

    detailRenderer.postRender = function() {
        $('body').append('<div id="blocker"/><div id="tooltip"/>');
        this.drawSubsections();
        this.createDataTables();
        if (this.data.section.files.length<10) {
            this.createMainFileTable();
        } else {
            this.createBigFileTable();
        }
        this.createMainLinkTable();
        this.showRightColumn();
        this.handleSectionArtifacts();
        this.handleTableExpansion();
        this.handleOrganisations();
        this.handleFileDownloadSelection();
        this.formatPageHtml();
        this.handleAnchors();
        this.handleSubattributes();
        this.handleOntologyLinks();
        this.handleORCIDIntegration();
        this.handleSimilarStudies();
        this.handleImageURLs();
        //handleCitation();
        this.handleProjectBasedScriptInjection();
        this.handleTableCentering();
        this.handleThumbnails(); //keep this as the last call

    }

    detailRenderer.handleProjectBasedScriptInjection = function() {
        var acc = $('#accession').text();
        $(projectScripts.filter(function (r) {
            return r.regex.test(acc)
        })).each(function (i, v) {
            var scriptURL = contextPath + '/js/projects/' + v.script;
            $.getScript(scriptURL);
        });

    }

    detailRenderer.handleCitation = function() {

        $('#cite').bind('click', function () {
            var data = {};
            data.id = $('#orcid-accession').text();
            data.title = $('#orcid-title').text();
            if (data.title[data.title.length - 1] == '.') data.title = data.title.slice(0, -1);
            data.authors = $('.author span[itemprop]').map(function () {
                return $(this).text();
            }).toArray();
            data.issued = new Date($('#orcid-publication-year').text()).getFullYear();
            data.URL = [window.location.href.split("?")[0].split("#")[0]];
            data.today = (new Date()).toLocaleDateString("en-gb", {year: 'numeric', month: 'long', day: 'numeric'});
            data.code = data.authors[0].replace(/ /g, '') + data.issued;
            var templateSource = $('script#citation-template').html();
            var template = Handlebars.compile(templateSource);
            $('#biostudies-citation').html(template(data));
            $('#biostudies-citation').foundation('open');
        })

    }

    detailRenderer.showRightColumn = function() {
        if ($('#right-column').text().trim().length > 0) {
            $('#right-column').show();
        }

        $('#expand-right-column').click(function () {
            var expanded = $(this).data('expanded') == true;
            $(this).data('expanded', !expanded);
            $('#right-column').css('width', expanded ? '30%' : '100%');
            $("i", $(this)).toggleClass('fa-angle-double-left fa-angle-double-right');
            $(this).find('[data-fa-i2svg]').toggleClass('fa-angle-double-left fa-angle-double-right');
        });
    }

    detailRenderer.createDataTables = function() {
        $(".section-table").each(function () {
            var dt = $(this).DataTable({
                "dom": "t",
                paging: false
            });
            DetailRenderer.sectionTables.push(dt);
        });
    }

    detailRenderer.createMainLinkTable = function() {

        //create external links for known link types
        var typeIndex = $('thead tr th', $("#link-list")).map(function (i, v) {
            if ($(v).text().toLowerCase() == 'type') return i;
        }).filter(isFinite)[0];
        $("tr", $("#link-list")).each(function (i, row) {
            if (i == 0) return;
            var type = $($('td', row)[typeIndex]).text().toLowerCase();
            var url = DetailRenderer.getURL($($('td', row)[0]).text(), type);
            if (url) {
                $($('td', row)[0]).wrapInner('<a href="' + url.url + '" target="_blank">');
            }
            $($('td', row)[0]).addClass("overflow-name-column");
        });

        //format the right column tables
        DetailRenderer.linksTable = $("#link-list").DataTable({
            "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
            "dom": "rlftpi",
            "infoCallback": function (settings, start, end, max, total, out) {
                return (total == max) ? out : out + ' <a class="section-button" id="clear-filter" onclick="DetailRenderer.clearLinkFilter();return false;">' +
                    '<span class="fa-layers fa-fw">'
                    + '<i class="fas fa-filter"></i>'
                    + '<span class="fa-layers-text" data-fa-transform="shrink-2 down-4 right-6">×</span>'
                    + '</span> show all links</a>';
            }
        });

    }

    detailRenderer.getURL = function(accession, type) {
        if (!type) {
            type = /^[a-zA-z]+/.exec(accession);
            if (type && type.length) {
                type = type[0];
            } else {
                return null;
            }
        }
        var url = linkMap[type.toLowerCase()] ? String.format(linkMap[type.toLowerCase()], encodeURIComponent(accession)) : null;
        if (type.toLowerCase() == 'ega' && accession.toUpperCase().indexOf('EGAD') == 0) {
            url = url.replace('/studies/', '/datasets/');
        }
        if (accession.indexOf('http:') == 0 || accession.indexOf('https:') == 0 || accession.indexOf('ftp:') == 0) {
            var value = accession.replace("http://", '').replace("https://", '').replace("ftp://", '')
            for (var r in reverseLinkMap) {
                var acc = new RegExp(r).exec(value);
                if (acc && acc.length > 0) {
                    return {url: accession, type: reverseLinkMap[r], text: acc[1]}
                }
            }
            url = accession;
        }
        return url ? {url: url, type: type, text: accession} : null;
    }

    detailRenderer.drawSubsections = function() {
        // draw subsection and hide them
        $(".indented-section").prepend('<span class="toggle-section fa-icon" title="Click to expand"><i class="fa-fw fas fa-caret-right"></i></span>')
        $(".indented-section").next().hide();

        $('.toggle-section').parent().css('cursor', 'pointer');
        $('.toggle-section').parent().on('click', function () {
            var indented_section = $(this).parent().children().first().next();
            if (indented_section.css('display') == 'none') {
                $(this).children().first().find('[data-fa-i2svg]').toggleClass('fa-caret-down fa-caret-right').attr('title', 'Click to collapse');
                indented_section.show();
                //redrawTables(true);
            } else {
                $(this).children().first().find('[data-fa-i2svg]').toggleClass('fa-caret-down fa-caret-right').attr('title', 'Click to expand');
                indented_section.hide();
                //redrawTables(true);
            }
        })
        // limit section title clicks
        $(".section-title-bar").click(function (e) {
            e.stopPropagation();
        })
    }

    detailRenderer.handleSectionArtifacts = function() {
        $(".toggle-files, .toggle-links, .toggle-tables").on('click', function () {
            var type = $(this).hasClass("toggle-files") ? "file" : $(this).hasClass("toggle-links") ? "link" : "table";
            var section = $(this).siblings('.bs-section-' + type + 's');
            if (section.css('display') == 'none') {
                section.show();
                //redrawTables(true);
                $(this).html('<i class="fa fa-caret-down"></i> hide ' + type + ($(this).data('total') == '1' ? '' : 's'))
            } else {
                section.hide();
                $(this).html('<i class="fa fa-caret-right"></i> show ' + type + ($(this).data('total') == '1' ? '' : 's'))
            }
        });
        $(".toggle-files, .toggle-links, .toggle-tables").each(function () {
            var type = $(this).hasClass("toggle-files") ? "(s)" : $(this).hasClass("toggle-links") ? "link(s)" : "table";
            $(this).html('<i class="fa fa-caret-right"></i> show ' + type + ($(this).data('total') == '1' ? '' : 's'));
        });

        //handle file attribute table icons
        $(".attributes-icon").on('click', function () {
            DetailRenderer.closeFullScreen();
            var section = '#' + $(this).data('section-id');
            DetailRenderer.openHREF(section);
            var toggleLink = $(section).next().find('.toggle-tables').first();
            if (toggleLink.first().text().indexOf('show') >= 0) toggleLink.click();

        });

        // add link type filters
        $(".link-filter").on('change', function () {
            var filters = $(".link-filter:checked").map(function () {
                return '^' + this.id + '$'
            }).get();
            if (filters.length == 0) {
                filters = ['^$']
            }
            linksTable[$(this).data('position') - 1].column(1).search(filters.join('|'), true, false).draw()
        });

    }

    detailRenderer.handleTableExpansion = function() {
        $('#blocker').click(function () {
            /*if (lastExpandedTable) {
                $(lastExpandedTable).click();
            }*/
            DetailRenderer.closeFullScreen()
        });
        //table expansion
        $('.table-expander').click(function () {
            lastExpandedTable = this;
            $('.fullscreen .table-wrapper').css('max-height', '');
            $(this).find('[data-fa-i2svg]').toggleClass('fa-compress fa-expand');
            $(this).attr('title', $(this).hasClass('fa-expand') ? 'Click to expand' : 'Click to close');
            $('html').toggleClass('stop-scrolling');
            $('#blocker').toggleClass('blocker');
            $(this).parent().parent().toggleClass('fullscreen');
            $("table.dataTable tbody td a").css("max-width", $(this).hasClass('fa-expand') ? '200px' : '500px');
            $('.table-wrapper').css('height', 'auto');
            $('.table-wrapper').css('height', 'auto');
            $('.fullscreen .table-wrapper').css('max-height', (parseInt($(window).height()) * 0.80) + 'px').css('top', '45%');
            $('.fullscreen').css("top", ($(window).height() - $(this).parent().parent().height()) / 3 + "px");
            $('.fullscreen').css("left", ($(window).width() - $(this).parent().parent().width()) / 2 + "px");
        });

        $('.has-child-section :not(visible) > section > .toggle-tables').click(); // expand tables for hidden sections

    }

    detailRenderer.handleTableCentering = function() {
        $('.dataTable').on('draw.dt', function () {
            $('.fullscreen .table-wrapper').css('max-height', (parseInt($(window).height()) * 0.80) + 'px');
            $('.fullscreen').css("top", ($(window).height() - $(this).parent().parent().height()) / 3 + "px");
            //$('.fullscreen').css("left", ( $(window).width() - $(this).parent().parent().width() ) / 2 + "px");
        });

    }

    detailRenderer.handleOrganisations = function() {
        $('.org-link').each(function () {
            $(this).attr('href', '#' + $(this).data('affiliation'));
        });
        $('.org-link').click(function () {
            var href = $(this).attr('href');
            if ($(href).hasClass('hidden')) $('#expand-orgs').click();
            $('html, body').animate({
                scrollTop: $(href).offset().top
            }, 200, function () {
                $(href).addClass('highlight-author');
                $(href).animate({opacity: 1}, 3000, function () {
                    $(href).removeClass('highlight-author');
                });
            });
        });


        $('#bs-authors li .author').hover(
            function () {
                $(this).addClass('highlight-author')
                var isVisible = false;
                $('.org-link', this).each(function () {
                    $('#' + $(this).data('affiliation')).addClass('highlight-author');
                    isVisible |= $('#' + $(this).data('affiliation') + ':visible').length > 0;
                })
                if (!isVisible) {
                    $('#expand-orgs').addClass('highlight-author');
                }

            }, function () {
                $(this).removeClass('highlight-author')
                $('.org-link', this).each(function () {
                    $('#' + $(this).data('affiliation')).removeClass('highlight-author');
                })
                $('#expand-orgs').removeClass('highlight-author');
            }
        )


        $('#bs-orgs li').hover(
            function () {
                if ($('span.more', $(this)).length) return;
                $(this).addClass('highlight-author')
                $('.org-link[data-affiliation="' + this.id + '"]').parent().parent().addClass('highlight-author')
                if ($('.highlight-author:visible').length == 1) {
                    $('#expand-authors').addClass('highlight-author')
                }
            }, function () {
                $(this).removeClass('highlight-author')
                $('.org-link[data-affiliation="' + this.id + '"]').parent().parent().removeClass('highlight-author')
                $('#expand-authors').removeClass('highlight-author')
            }
        )
    }

    detailRenderer.formatPageHtml = function() {

        updateTitleFromBreadCrumbs();

        //replace all newlines with html tags
        $('#ae-detail > .value').each(function () {
            var html = $(this).html();
            if (html.indexOf('<') < 0) { // replace only if no tags are inside
                $(this).html($(this).html().replace(/\n/g, '<br/>'))
            }
        });


        //handle escape key on fullscreen
        $(document).on('keydown', function (e) {
            if (e.keyCode === 27) {
                DetailRenderer.closeFullScreen();
            }
        });

        // add highlights
        // $("#renderedContent").highlight(['mice','crkl']);
        // $("#renderedContent").highlight(['ductal','CrkII '],{className:'synonym'});
        // $("#renderedContent").highlight(['mouse','gland '],{className:'efo'});
        //
        //
        // $("#renderedContent .highlight").attr('title','This is exact string matched for input query terms');
        // $("#renderedContent .efo").attr('title','This is matched child term from Experimental Factor Ontology e.g. brain and subparts of brain');
        // $("#renderedContent .synonym").attr('title','This is synonym matched from Experimental Factor Ontology e.g. neoplasia for cancer');


    }

    detailRenderer.openHREF = function(href) {
        var section = $(href);
        var bbox = $(section)[0].getBoundingClientRect();
        if (bbox.x > window.innerWidth
            || bbox.y > window.innerHeight
            || bbox.x + bbox.width < 0
            || bbox.y + bbox.height < 0
        ) {
            $('html, body').animate({
                scrollTop: $(section).offset().top - 10
            }, 200);
        }
    }

    detailRenderer.handleAnchors = function() {
        // scroll to main anchor
        if (location.hash) {
            $('#left-column').show();
            DetailRenderer.openHREF(location.hash);
        } else {
            $('#left-column').slideDown();
        }

        // add file filter button for section
        /*if(DetailRenderer.filesTable.column(':contains(Section)')) {
            $(DetailRenderer.filesTable.column(':contains(Section)').nodes()).each(function () {
                var divId = $(this).data('search');
                if (divId != '') {
                    var bar = $('#' + divId + '> .bs-name > .section-title-bar');
                    if (!$('a[data-files-id="' + divId + '"]', bar).length) {
                        bar.append('<a class="section-button" data-files-id="'
                            + divId + '"><i class="fa fa-filter"></i> show files in this section</a>'
                        );
                    }
                }
            });
        }*/
        // handle clicks on file filters in section
        $("a[data-files-id]").click(function () {
            expansionSource = '' + $(this).data('files-id');
            DetailRenderer.clearFileFilter();
            $('#all-files-expander').click();
            DetailRenderer.filesTable.column(3).search('^' + DetailRenderer.accToLink(expansionSource) + '$', true, false);
            // hide empty columns
            DetailRenderer.filesTable.columns().every(function () {
                if (filesTable.cells({search: 'applied'}, this).data().join('').trim() == '') this.visible(false)
            });
            DetailRenderer.filesTable.draw();
        });

        // add file filter button for section
        $(DetailRenderer.linksTable.column(':contains(Section)').nodes()).each(function () {
            var divId = $(this).data('search');
            if (divId != '') {
                var bar = $('#' + divId + '> .bs-name > .section-title-bar');
                if (!$('a[data-links-id="' + divId + '"]', bar).length) {
                    bar.append('<a class="section-button" data-links-id="'
                        + divId + '"><i class="fa fa-filter"></i> show links in this section</a>'
                    );
                }
            }
        });
        // handle clicks on link filters in section
        $("a[data-links-id]").click(function () {
            expansionSource = '' + $(this).data('links-id');
            DetailRenderer.clearLinkFilter();
            $('#all-links-expander').click();
            DetailRenderer.linksTable.column(':contains(Section)').search('^' + DetailRenderer.accToLink(expansionSource) + '$', true, false);
            // hide empty columns
            DetailRenderer.linksTable.columns().every(function () {
                if (linksTable.cells({search: 'applied'}, this).data().join('').trim() == '') this.visible(false)
            });
            DetailRenderer.linksTable.draw();
        });


        //handle author list expansion
        $('#bs-authors li span.more').click(function () {
            $('#bs-authors li').removeClass('hidden');
            $(this).parent().remove();
        });

        //handle org list expansion
        $('#bs-orgs li span.more').click(function () {
            $('#bs-orgs li').removeClass('hidden');
            $(this).parent().remove();
        });

        // add file search filter
        if (params['fs']) {
            $('#all-files-expander').click();
            DetailRenderer.filesTable.search(params['fs']).draw();
        }

        // expand right column if needed
        if (params['xr']) {
            $('#expand-right-column').click()
        }

    }

    detailRenderer.handleFileDownloadSelection = function() {
        $("#file-list tbody").on('click', 'input[type="checkbox"]', function () {
            $(this).toggleClass('selected');
            DetailRenderer.updateSelectedFiles($(this).hasClass('selected') ? 1 : -1);
        });
        $("#file-list tbody tr td a").on('click', function () {
            event.stopPropagation();
        });
        $("#download-selected-files").on('click', function () {
            // select all checked input boxes and get the href in the links contained in their siblings
            var files = $.map($('input.selected', filesTable.column(0).nodes()), function (v) {
                return $(v).data('name');
            });
            DetailRenderer.downloadFiles(files);
        });
        $("#select-all-files").on('click', function () {
            var isChecked = $(this).is(':checked');
            if (!isChecked) {
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).prop('checked', false);
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).removeAttr('checked');
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).removeProp('checked');
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).removeClass('selected');
                selectedFilesCount = 0;
            } else {
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).prop('checked', true);
                $('input[type="checkbox"]', filesTable.column(0, {search: 'applied'}).nodes()).addClass('selected');
                selectedFilesCount = filesTable.column(0, {search: 'applied'}).nodes().length;
            }
            DetailRenderer.updateSelectedFiles(0);
        });
        DetailRenderer.updateSelectedFiles(0);
    }

    detailRenderer.updateSelectedFiles = function(inc) {

        if (!DetailRenderer.filesTable || !DetailRenderer.filesTable.rows() || !DetailRenderer.filesTable.rows().eq(0)) return;
        selectedFilesCount += inc;
        $("#selected-file-text").text((selectedFilesCount == 0
            ? 'No ' : selectedFilesCount)
            + ' file' + (selectedFilesCount > 1 ? 's' : '') + ' selected');
        if (selectedFilesCount == 0) {
            $('#download-selected-files').hide();
        } else {
            $('#download-selected-files').show();
            $('#download-selected-files').text('Download' + (selectedFilesCount == 2
                ? ' both'
                : selectedFilesCount > 1 ? ' all ' + selectedFilesCount : ''));
        }

        $("#select-all-files").prop('checked', selectedFilesCount == totalRows);

    }

    detailRenderer.downloadFiles = function(files) {
        var html = '<form method="POST" target="_blank" action="'
            + contextPath + "/files/"
            + $('#accession').text() + '/zip' + location.search + '">';
        $(files).each(function (i, v) {
            html += '<input type="hidden" name="files" value="' + v + '"/>'
        });
        html += '</form>';
        var submissionForm = $(html);
        $('body').append(submissionForm);
        $(submissionForm).submit();
    }

    detailRenderer.clearFileFilter = function() {
        DetailRenderer.filesTable.columns().visible(true);
        DetailRenderer.filesTable.search('').columns().search('').draw();
    }

    detailRenderer.clearLinkFilter = function() {
        DetailRenderer.linksTable.columns().visible(true);
        DetailRenderer.linksTable.search('').columns().search('').draw();
    }

    detailRenderer.handleThumbnails = function() {
        $(DetailRenderer.filesTable.column(1).nodes()).each(function () {
            var path = $('input', $(this).prev()).data('name');
            $('a', this).addClass('overflow-name-column');
            $('a', this).attr('title', $(this).text());
            if ($.inArray(path.toLowerCase().substring(path.lastIndexOf('.') + 1),
                ['bmp', 'jpg', 'wbmp', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'pdf', 'docx', 'txt', 'csv', 'html', 'htm']) >= 0) {
                $(this).append('<a href="' + $(this).find('a').attr('href') + '" class="thumbnail-icon" data-thumbnail="'
                    + contextPath + '/thumbnail/' + $('#accession').text() + '/' + path + '"><i class="far fa-file-image"></i></a>')
            }
        })

        $(DetailRenderer.filesTable.column(1).nodes()).hover(function () {
            var $tn = $(this).find('.thumbnail-icon');
            if (!$tn.length) return;
            $('#thumbnail').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="sr-only">Loading...</span>')
            $('#thumbnail').css('top', $tn.offset().top - 10);
            $('#thumbnail').css('left', $('#file-list-container').offset().left - $('#thumbnail').width() - 10);
            $('#thumbnail').show();
            var img = $("<img />").attr('src', $tn.data('thumbnail'))
                .on('load', function () {
                    if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                        $('#thumbnail').hide();
                    } else {
                        $('#thumbnail').html('').append(img)
                        $('#thumbnail').css('top', $tn.offset().top - 10);
                        $('#thumbnail').css('left', $('#file-list-container').offset().left - $('#thumbnail').width() - 10);
                        $('#thumbnail').show();
                    }
                });
        }, function () {
            $('#thumbnail').hide();
        });

    }

    detailRenderer.getByteString = function(b) {
        if (b == undefined) return '';
        if (b == 0) return '0 bytes';
        if (b == 1) return '1 byte';
        prec = {'bytes': 0, 'KB': 0, 'MB': 1, 'GB': 2, 'TB': 2, 'PB': 2, 'EB': 2, 'ZB': 2, 'YB': 2};
        keys = $.map(prec, function (v, i) {
            return i
        });
        var i = Math.floor(Math.log(b) / Math.log(1000))
        return parseFloat(b / Math.pow(1000, i)).toFixed(prec[keys[i]]) + ' ' + keys[i];
    }

    detailRenderer.handleSubattributes = function() {
        // handle sub-attributes (shown with an (i) sign)
        $('.sub-attribute-info').hover(
            function () {
                $(this).next().css('display', 'inline-block');
                $(this).toggleClass('sub-attribute-text');
            }, function () {
                $(this).next().css('display', 'none');
                $(this).toggleClass('sub-attribute-text');
            }
        );
    }

    detailRenderer.handleOntologyLinks = function() {
        // handle ontology links
        $("span[data-term-id][data-ontology]").each(function () {
            var ont = $(this).data('ontology').toLowerCase();
            var termId = $(this).data('term-id');
            var name = $(this).data('term-name');
            $.ajax({
                async: true,
                context: this,
                url: "https://www.ebi.ac.uk/ols/api/ontologies/" + ont + "/terms",
                data: {short_form: termId, size: 1},
                success: function (data) {
                    if (data && data._embedded && data._embedded.terms && data._embedded.terms.length > 0) {
                        var n = name ? name : data._embedded.terms[0].description ? data._embedded.terms[0].description : null;
                        $(this).append('<a title="' + data._embedded.terms[0].obo_id +
                            (n ? ' - ' + n : '') + '" ' +
                            'class="ontology-icon"  target="_blank" href="' + data._embedded.terms[0].iri
                            + '"><span class="icon icon-conceptual" data-icon="o"></span></a>');
                    }
                }
            });

        });
    }

    detailRenderer.closeFullScreen = function() {
        $('.table-expander', '.fullscreen').click();
        $('#right-column-expander', '.fullscreen').click();
        if (expansionSource) {
            DetailRenderer.openHREF('#' + expansionSource);
            expansionSource = null;
            DetailRenderer.clearLinkFilter();
            DetailRenderer.clearFileFilter();
        }
    }

    detailRenderer.handleSimilarStudies = function() {
        var accession = $('#accession').text();
        var url = window.location.pathname;
        url = url.replace('/studies/', '/api/v1/studies/').replace(project, '') + "/similar";
        $.getJSON(url, function (data) {
            var templateSource = $('script#main-similar-studies').html();
            var template = Handlebars.compile(templateSource);
            $('#right-column-content').append(template(data.similarStudies));
        })
    }

    detailRenderer.handleORCIDIntegration = function() {
        if (typeof thorApplicationNamespace === "undefined") {
            $('#orc-id-claimer-section').hide();
            return;
        }
        ;
        var accession = $('#orcid-accession').text();
        thorApplicationNamespace.createWorkOrcId(
            $('#orcid-title').text(),
            'other', // work type from https://github.com/ORCID/ORCID-Source/blob/master/orcid-model/src/main/resources/record_2.0/work-2.0.xsd
            new Date(Date.parse($('#orcid-publication-year').text())).getFullYear(),
            document.location.origin + contextPath + "/studies/" + accession,
            null, // description
            'BIOSTUDIES' // db name
        );
        thorApplicationNamespace.addWorkIdentifier('other-id', accession);
        thorApplicationNamespace.loadClaimingInfo();
    }

    detailRenderer.handleImageURLs = function() {
        // handle image URLs
        $(".sub-attribute:contains('Image URL')").each(function () {
            var url = $(this).parent().clone().children().remove().end().text();
            $(this).parent().html('<img class="url-image" src="' + url + '"/>');
        });
    }

    detailRenderer.accToLink = function(acc) {
        return acc.replace('/', '').replace(' ', '');
    }

    detailRenderer.render = function (data) {

        // set accession
        $('#accession').text(data.accno);
        //copy outer attributes one step down
        data.section.accno = data.accno;
        var rootPath = data.attributes.filter( function (v,i) { return    v.name=='RootPath';   });
        data.section.root = rootPath.length ? rootPath[0].value : '';
        var releaseDate = data.attributes.filter( function (v,i) { return    v.name=='ReleaseDate';   });
        data.section.releaseDate = releaseDate.length ? releaseDate[0].value : '';
        var title = data.attributes.filter( function (v,i) { return    v.name=='Title';   });
        if (!data.section.attributes.filter( function (v,i) { return    v.name=='Title';   }).length) {
            data.section.attributes.push({name:'Title', value:title[0].value});
        }
        var files = DetailRenderer.findall(data.section,'files');
        data.section.files = files;

        // set data to private variable
        this.data = data
        $('#renderedContent').html(template(this.data.section));
        DetailRenderer.postRender();
    };
    return detailRenderer;
}());


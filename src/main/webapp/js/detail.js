!function(d) {

    var params = document.location.search.replace(/(^\?)/,'').split("&").map(
        function(s) {
            return s = s.split("="), this[s[0]] = s[1], this
        }.bind({}))[0];
    registerHelpers();

    // Prepare template
    var templateSource = $('script#study-template').html();
    var template = Handlebars.compile(templateSource);
    var url = window.location.href;
    url = url.replace('studies','api/studies');
    // Data in json
    $.getJSON(url,params, function (data) {
        // Generate html using template and data
        data.submissions[0].section.accno = data.submissions[0].accno;
        var html = template(data.submissions[0].section);
        // Add the result to the DOM
        d.getElementById('renderedContent').innerHTML = html;

        postRender();

    });
}(document);

function registerHelpers() {

    Handlebars.registerHelper('find', function(key, keyval, val, obj) {
        var e = obj.filter( function(o) { return o[key]==keyval})[0];
        if (e!=undefined) return new Handlebars.SafeString(e[val]);
    });

    Handlebars.registerHelper('valueWithName', function(val, obj) {
        if (obj==null) return;
        var e = obj.filter( function(o) { return o['name']==val})[0];
        return (e!=undefined) ? new Handlebars.SafeString(e['value']) : '-';
    });

    Handlebars.registerHelper('section', function(o, shouldIndent) {
        var template = Handlebars.compile($('script#section-template').html());
        this.indentClass = (shouldIndent=='true') ? 'indented-section' : '';
        return template(o);
    });

    Handlebars.registerHelper('table', function(o) {
        var template = Handlebars.compile($('script#section-table').html());
        return template(o);
    });

    Handlebars.registerHelper('ifArray', function(arr,options) {
        if(Array.isArray(arr)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('ifRenderable', function(arr,options) {
        var specialSections = ['publication', 'author', 'organization'];

        if($.inArray(arr.type.toLowerCase(),specialSections) < 0) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('eachGroup', function(key, val, arr, options) {
        var mod = arr.reduce(function(r, i) {
            r[i[key]] = r[i[key]] || [];
            r[i[key]].push(i[val]);
            return r;
        }, {})
        var ret = '';
        for(var k in mod) {
            ret = ret + options.fn({name:k,value:mod[k].join(',')});
        }
        return ret;
    });


    Handlebars.registerHelper('setHeaders', function() {
        var names = $.map(this, function (v) {
            return $.map(v.attributes, function (v) {
                return v.name
            })
        })
        this.headers = $.unique(names);
        this.type = this[0].type
    });

    Handlebars.registerHelper('setFileTableHeaders', function() {
        if (this && this.length) {
            var names = ['Name', 'Size'];
            var hsh = {'Name': 1, 'Size': 1};
            $.each(this, function (i, v) {
                v.attributes = v.attributes || [];
                v.attributes.push({"name": "Name", "value": v.path});
                $.each(v.attributes, function (i, v) {
                    if (!(v.name in hsh)) {
                        names.push(v.name);
                        hsh[v.name] = 1;
                    }
                })
            });
            this.headers = names;
            this.type = this[0].type
        }
    });

    Handlebars.registerHelper('file-table', function() {
        var o = findall(this,'files');
        var template = Handlebars.compile($('script#file-table').html());
        return template(o);
    });

    Handlebars.registerHelper('asString', function(v) {
        console.log(v)
        console.log(this)
        return this.name
    });

    Handlebars.registerHelper('eachAuthor', function(obj, options) {
        var ret = '';
        var orgs = {}
        // make an org map
        $.each(obj.subsections.filter( function(o) { return o.type.toLowerCase()=='organization';}), function (i,o) {
            orgs[o.accno] = o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'})[0].value;
        });

        $.each(obj.subsections.filter( function(o) { return o.type.toLowerCase()=='author';}), function (i,o) {
            var author = {}
            $.each(o.attributes, function (i,v) {
                author[v.name] = v.value;
            });
            author.affiliationNumber = Object.keys(orgs).indexOf(author.affiliation)+1
            ret += options.fn(author);
        });
        return ret;
    });
    Handlebars.registerHelper('eachOrganization', function(obj, options) {
        var ret = '';
        var orgs = {}
        // make an org map
        $.each(obj.subsections.filter( function(o) { return o.type.toLowerCase()=='organization';}), function (i,o) {
            orgs[o.accno] = o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'})[0].value;
        });

        $.each(Object.keys(orgs), function (i,v) {
            ret += options.fn({name:orgs[v],affiliationNumber:i+1, affiliation:v});
        });
        return ret;
    });


}

function findall(obj,k){
    var ret = [];
    for(var key in obj)
    {
        if (key===k) {
            $.merge(ret,obj[k]);
        } else if(typeof(obj[key]) == "object"){
            $.merge(ret,findall(obj[key],k));
        }
    }
    //unroll file tables
    return $.map( ret, function(n){
        return n;
    });
}

function postRender() {
    $('body').append('<div id="blocker"/><div id="tooltip"/>');
    drawSubsections();
    createDataTables();
    createMainFileTable();
    handleSectionArtifacts();
    handleTableExpansion();
    handleOrganisations();
}


function createDataTables() {
    $(".section-table").each(function () {
        $(this).DataTable({
            "dom": "t",
            paging: false
        });
    });
}

function createMainFileTable() {
    $("#file-list").DataTable({

        "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
        "columnDefs": [ {"targets": [0], "searchable": false, "orderable": false, "visible": true},
         //   {"targets": [2], "searchable": true, "orderable": false, "visible": false}
            ],
        "dom": "rlftpi",
        "infoCallback": function( settings, start, end, max, total, out ) {
            return (total== max) ? out : out +'<br/><a class="section-button" id="clear-filter" onclick="clearFilter();return false;">' +
                '<span class="fa-stack bs-icon-fa-stack">' +
                '<i class="fa fa-filter fa-stack-1x"></i>' +
                '<i class="fa-stack-1x filter-cross">×</i>' +
                '</span> clear filter</a>';
        }
    });
}

function drawSubsections() {
    // draw subsection and hide them
    $(".indented-section").prepend('<span class="toggle-section fa-fw fa fa-caret-right fa-icon" title="Click to expand"/>')
    $(".indented-section").next().hide();

    $('.toggle-section').parent().css('cursor', 'pointer');
    $('.toggle-section').parent().on('click', function () {
        var indented_section = $(this).parent().children().first().next();
        if (indented_section.css('display') == 'none') {
            $(this).children().first().toggleClass('fa-caret-down').toggleClass('fa-caret-right').attr('title', 'Click to collapse');
            indented_section.show();
            //redrawTables(true);
        } else {
            $(this).children().first().toggleClass('fa-caret-down').toggleClass('fa-caret-right').attr('title', 'Click to expand');
            indented_section.hide();
            //redrawTables(true);
        }
    })
    // limit section title clicks
    $(".section-title-bar").click(function(e) {
        e.stopPropagation();
    })
}

function handleSectionArtifacts() {
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
        var type = $(this).hasClass("toggle-files") ? "file" : $(this).hasClass("toggle-links") ? "link" : "table";
        $(this).html('<i class="fa fa-caret-right"></i> show ' + type + ($(this).data('total') == '1' ? '' : 's'));
    });

    //handle file attribute table icons
    $(".attributes-icon").on ('click', function () {
        closeFullScreen();
        var section = '#'+$(this).data('section-id');
        openHREF(section);
        var toggleLink = $(section).next().find('.toggle-tables').first();
        if (toggleLink.first().text().indexOf('show')>=0) toggleLink.click();

    });

    // add link type filters
    $(".link-filter").on('change', function() {
        var filters = $(".link-filter:checked").map(function() { return '^'+this.id+'$'}).get();
        if (filters.length==0) {
            filters = ['^$']
        }
        linksTable[$(this).data('position')-1].column(1).search(filters.join('|'),true, false).draw()
    });

}

function handleTableExpansion() {
    //table expansion
    $('.table-expander').click(function () {
        $('.fullscreen .table-wrapper').css('max-height','');
        $(this).toggleClass('fa-close').toggleClass('fa-expand');
        $(this).attr('title', $(this).hasClass('fa-expand') ? 'Click to expand' : 'Click to close');
        $('html').toggleClass('stop-scrolling');
        $('#blocker').toggleClass('blocker');
        $(this).parent().parent().toggleClass('fullscreen');
        $("table.dataTable tbody td a").css("max-width", $(this).hasClass('fa-expand') ? '200px' : '500px');
        $('.table-wrapper').css('height', 'auto');
        $('.table-wrapper').css('height', 'auto');
        $('.fullscreen .table-wrapper').css('max-height', (parseInt($(window).height()) * 0.80) + 'px').css('top', '45%');
    });
}

function handleOrganisations() {
    $('.org-link').each( function () {
        $(this).attr('href','#'+$(this).data('affiliation'));
    });
    $('.org-link').click(function () {
        var href = $(this).attr('href');
        /*if (!$(href).is(':visible')) {
            $('#hidden-orgs').find('a.show-more').click()
        }*/
        console.log(href)
        $('html, body').animate({
            scrollTop: $(href).offset().top
        }, 200);

        $(href).animate({opacity: 0.8}, 200, function () {
            $(href).css('background-color', 'yellow');
            $(href).css('color', 'black');
            $(href).animate({opacity: 0.4}, 3000, function () {
                $(href).css('background-color', 'lightgray');
                $(href).animate({opacity: 1}, 600);
                $(href).css('background-color', 'transparent');
                $(href).css('color', '');
            })
        });

    });
}
!function(d) {
    $('#login-button').click( function () {
        showLoginForm();
    });
    $('.popup-close').click( function () {
        $(this).parent().parent().hide();
    });
    $('#logout-button').click( function () {
        $('#logout-form').submit();
    });

    var message = $.cookie("AeAuthMessage");
    if(message) {
        $('#login-status').text(message).show();
        showLoginForm();
    }
    var user = $.cookie("AeAuthUser");
    if(user) {
        $('#user-field').attr('value',user);
        $('#pass-field').focus();
    }

    if(project) {
        // display project banner
        $.getJSON(contextPath + "/api/v1/studies/" + project, function (data) {
            showProjectBanner(data);
        }).fail(function (error) {
            showError(error);
        });
    }

    var autoCompleteFixSet = function() {
        $(this).attr('autocomplete', 'off');
    };
    var autoCompleteFixUnset = function() {
        $(this).removeAttr('autocomplete');
    };

    $("#query").autocomplete(
        contextPath + "/api/v1/autocomplete/keywords"
        , { matchContains: false
            , selectFirst: false
            , scroll: true
            , max: 50
            , requestTreeUrl: contextPath + "/api/v1/autocomplete/efotree"
        }
    ).focus(autoCompleteFixSet).blur(autoCompleteFixUnset).removeAttr('autocomplete');
    updateTitleFromBreadCrumbs();
}(document);


function updateTitleFromBreadCrumbs() {
    //update title
    var breadcrumbs = $($('.breadcrumbs').text().split(/\s+/)).map(function  () { return this.trim(); }).filter(function () { return this!="" && this!='Current:';}).get().reverse();
    document.title = breadcrumbs.length ? breadcrumbs.join(' < ' )+' < EMBL-EBI' : 'BioStudies < EMBL-EBI';
}

function showLoginForm() {
    $('#login-form').show();
    $('#user-field').focus();
}

function showError(error) {
    var errorTemplateSource = $('script#error-template').html();
    var errorTemplate = Handlebars.compile(errorTemplateSource);
    var data;
    switch (error.status) {
        case 400:
            data = {
                title: 'We’re sorry that we cannot process your request',
                message: 'There was a query syntax error in <span class="alert"><xsl:value-of select="$error-message"/></span>. Please try a different query or check our <a href="{$context-path}/help/index.html">query syntax help</a>.'
            }
            break;

        case 403:
            data = {
                title: 'We’re sorry that you don’t have access to this page or file',
                message: 'Please <a href="#" class="login">log in</a> to access <span class="alert"><xsl:value-of select="$error-request-uri"/></span>.'
            }
            break;

        case 404:
            data = {
                title: 'We’re sorry that the page or file you’ve requested is not publicly available',
                message: 'The resource may have been removed, had its name changed, or has restricted access.If you have been granted access, please <a href="#" class="login">log in</a> to proceed.'
            }
            break;

        default:
            data = {
                title: 'Oops! Something has gone wrong with BioStudies',
                message: 'The service you are trying to access is currently unavailable. We’re very sorry. Please try again later or use the feedback link to report if the problem persists.'
            }
            break;
    }

    var html = errorTemplate(data);
    $('#renderedContent').html(html);
    $('.breadcrumbs li:last').contents().last().replaceWith(' Error');
    updateTitleFromBreadCrumbs();
}


function showProjectBanner(data) {
    var templateSource = $('script#project-banner-template').html();
    var template = Handlebars.compile(templateSource);
    var projectObj={};
    try {
        projectObj = {logo: contextPath + '/files/' + data.accno + '/' + data.section.files[0][0].path};
    } catch(e){}
    $(data.section.attributes).each(function () {
        projectObj[this.name.toLowerCase()] = this.value
    })
    var html = template(projectObj);
    $('#project-banner').html(html);

    // add project search checkbox
    $('#example').append('<label id="project-search"><input id="search-in-project" type="checkbox" />Search in '+projectObj.title+' only</label>');
    $('#search-in-project').bind('change', function(){
        $('#ebi_search').attr('action', ($(this).is(':checked')) ? contextPath+'/'+data.accno+'/studies' : contextPath+'/studies');
    });
    $('#search-in-project').click();

    //fix breadcrumbs
    $('ul.breadcrumbs').children().first().next().html('<li><a href="/biostudies/'+project+'/studies">'+projectObj.title+'</a></li>')
}

function formatNumber(s) {
    return new Number(s).toLocaleString();
}

String.format = function() {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
};

$.fn.groupBy = function(fn) {
    var arr = $(this),grouped = {};
    $.each(arr, function (i, o) {
        key = fn(o);
        if (typeof(grouped[key]) === "undefined") {
            grouped[key] = [];
        }
        grouped[key].push(o);
    });

    return grouped;
};

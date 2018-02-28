<%@ tag import="uk.ac.ebi.biostudies.auth.Session" %>
<%@ tag description="Generic page" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri = "http://java.sun.com/jsp/jstl/functions" prefix = "fn" %>
<%@taglib uri="http://www.springframework.org/tags" prefix="spring" %>
<%@attribute name="postBody" fragment="true" %>
<%@attribute name="head" fragment="true" %>
<%@attribute name="breadcrumbs" fragment="true" %>
<c:set var="contextPath" value="${pageContext.request.contextPath}" />
<c:set var="currentUser" value="${Session.getCurrentUser()}"/>
<c:set var="pathname" value="${requestScope['javax.servlet.forward.request_uri']}"/>
<c:set var="pagename" value="${fn:replace(pageContext.request.requestURI,pageContext.request.contextPath,'')}"/>

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>The European Bioinformatics Institute &lt; EMBL-EBI</title>
    <meta name="description" content="EMBL-EBI" /><!-- Describe what this page is about -->
    <meta name="keywords" content="bioinformatics, europe, institute" /><!-- A few keywords that relate to the content of THIS PAGE (not the whol project) -->
    <meta name="author" content="EMBL-EBI" /><!-- Your [project-name] here -->
    <meta name="HandheldFriendly" content="true" />
    <meta name="MobileOptimized" content="width" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#70BDBD" /> <!-- Android Chrome mobile browser tab color -->
    <meta http-equiv="pragma" content="no-cache" />

    <!-- If you link to any other sites frequently, consider optimising performance with a DNS prefetch -->
    <link rel="dns-prefetch" href="//embl.de" />

    <!-- If you have custom icon, replace these as appropriate.
         You can generate them at realfavicongenerator.net -->
    <link rel="icon" type="image/x-icon" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/favicon.ico" />
    <link rel="icon" type="image/png" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192×192" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/android-chrome-192x192.png" /> <!-- Android (192px) -->
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/apple-icon-114x114.png" /> <!-- For iPhone 4 Retina display (114px) -->
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/apple-icon-72x72.png" /> <!-- For iPad (72px) -->
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/apple-icon-144x144.png" /> <!-- For iPad retinat (144px) -->
    <link rel="apple-touch-icon-precomposed" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/apple-icon-57x57.png" /> <!-- For iPhone (57px) -->
    <link rel="mask-icon" href="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/safari-pinned-tab.svg" color="#ffffff" /> <!-- Safari icon for pinned tab -->
    <meta name="msapplication-TileColor" content="#2b5797"> <!-- MS Icons -->
    <meta name="msapplication-TileImage" content="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/images/logos/EMBL-EBI/favicons/mstile-144x144.png" />

    <!-- CSS: implied media=all -->
    <!-- CSS concatenated and minified via ant build script-->
    <link rel="stylesheet" href="//www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/libraries/foundation-6/css/foundation.css" type="text/css" media="all" />
    <link rel="stylesheet" href="//www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/css/ebi-global.css" type="text/css" media="all" />
    <link rel="stylesheet" href="//www.ebi.ac.uk/web_guidelines/EBI-Icon-fonts/v1.2/fonts.css" type="text/css" media="all" />


    <!-- Use this CSS file for any custom styling -->
    <!--
      <link rel="stylesheet" href="css/custom.css" type="text/css" media="all">
    -->

    <!-- If you have a custom header image or colour -->
    <!--
    <meta name="ebi:localmasthead-color" content="#000">
    <meta name="ebi:localmasthead-image" content="https://www.ebi.ac.uk/web_guidelines/EBI-Framework/images/backgrounds/embl-ebi-background.jpg">
    -->

    <!-- you can replace this with theme-[projectname].css. See http://www.ebi.ac.uk/web/style/colour for details of how to do this -->
    <!-- also inform ES so we can host your colour palette file -->
    <link rel="stylesheet" href="${contextPath}/css/theme-biostudies.css" type="text/css" media="all" />
    <link rel="stylesheet" href="${contextPath}/css/common.css" type="text/css" media="all" />

    <!-- for production the above can be replaced with -->
    <!--
    <link rel="stylesheet" href="//www.ebi.ac.uk/web_guidelines/css/compliance/mini/ebi-fluid-embl.css">
    -->

    <!-- end CSS-->

    <meta class="foundation-mq" />
    <jsp:invoke fragment="head"/>
</head>
<c:set var="query" value="${param.query}"/>
<body class="level2"><!-- add any of your classes or IDs -->
<div id="skip-to">
    <a href="#content">Skip to main content</a>
</div>
<header id="masthead-black-bar" class="clearfix masthead-black-bar">
    <nav class="row">
        <ul id="global-nav" class="menu">
            <!-- set active class as appropriate -->
            <li class="home-mobile"><a href="//www.ebi.ac.uk"></a></li>
            <li class="home active"><a href="//www.ebi.ac.uk">EMBL-EBI</a></li>
            <li class="services"><a href="//www.ebi.ac.uk/services">Services</a></li>
            <li class="research"><a href="//www.ebi.ac.uk/research">Research</a></li>
            <li class="training"><a href="//www.ebi.ac.uk/training">Training</a></li>
            <li class="about"><a href="//www.ebi.ac.uk/about">About us</a></li>
            <li class="search">
                <a href="#" data-toggle="search-global-dropdown"><span class="show-for-small-only">Search</span></a>
                <div id="search-global-dropdown" class="dropdown-pane" data-dropdown data-options="closeOnClick:true;">
                    <!-- The dropdown menu will be programatically added by script.js -->
                </div>
            </li>
            <li class="float-right show-for-medium embl-selector">
                <button class="button float-right" type="button" data-toggle="embl-dropdown">Hinxton</button>
                <!-- The dropdown menu will be programatically added by script.js -->
            </li>
        </ul>
    </nav>
</header>



<div id="content">
    <div data-sticky-container>
        <header id="masthead" class="masthead">
            <div class="masthead-inner row">

                <!-- local-title -->
                <div class="columns medium-7" id="local-title">
                    <h1><a href="${contextPath}" alt="BioStudies homepage" title="BioStudies homepage"><img src="${contextPath}/images/logo.png"/></a></h1>

                </div>
                <!-- /local-title -->
                <div class="column medium-5">
                    <form id="ebi_search" action="${contextPath}/studies">
                        <fieldset>
                            <div class="input-group margin-bottom-none margin-top-large">
                                <input id="query" class="input-group-field" tabindex="1" type="text" name="query"  size="35" maxlength="2048" placeholder="Search BioStudies" value="${fn:escapeXml(query)}" />
                                <div class="input-group-button">
                                    <input id="search_submit" class="button icon icon-functional" tabindex="2" type="submit" value="1" />
                                </div>
                            </div>
                        </fieldset>
                        <p id="example" class="small">
                            Examples: <a class="" href="${contextPath}/studies?query=hyperplasia">hyperplasia</a>, <a class="" href="${contextPath}/studies?query=PMC516016">PMC516016</a>
                            <!--a class="float-right" href="#"><span class="icon icon-generic" data-icon="("></span> advanced search</a-->
                        </p>
                    </form>

                </div>

                <!-- local-nav -->
                <nav>
                    <ul class="menu float-left" data-description="navigational">
                        <li class="${pagename.equals('/jsp/index.jsp')? 'active':''}" title="BioStudies v1.2.<spring:eval expression="@gitConfig.gitCommitIdAbbrev"/>"><a href="${contextPath}/">Home</a></li>
                        <li class="${pagename.equals('/jsp/search.jsp')? 'active':''}"><a href="${contextPath}/studies/" title="Browse BioStudies">Browse</a></li>
                        <li class="${pagename.equals('/jsp/submit.jsp')? 'active':''}"><a href="${contextPath}/submit" title="Submit a study">Submit</a></li>
                        <li class="${pagename.equals('/jsp/help.jsp')? 'active':''}"><a href="${contextPath}/help" title="Help">Help</a></li>
                        <li class="${pagename.equals('/jsp/about.jsp')? 'active':''}"><a href="${contextPath}/about" title="About BioStudies">About BioStudies</a></li>
                    </ul>
                    <ul class="dropdown menu float-right" data-description="tasks">
                        <li class=""><a href="${contextPath}" title="Send feedback"><span class="icon icon-functional" data-icon="n"></span> Feedback</a></li>
                        <li class="">
                            <c:choose>
                                <c:when test="${currentUser!=null}">
                                    <a id="logout-button" href="#" title="Logout"><i class="fa fa-sign-out-alt" aria-hidden="true"></i>
                                        Logout ${currentUser.getUsername()}</a>
                                </c:when>
                                <c:otherwise>
                                    <a id="login-button" href="#" title="Login"><span class="icon icon-functional" data-icon="l"></span>
                                        Login</a>
                                </c:otherwise>
                            </c:choose>
                        </li>
                    </ul>
                </nav>
                <!-- /local-nav -->
            </div>
        </header>
    </div>



    <div id="project-banner"></div>
    <script id='project-banner-template' type='text/x-handlebars-template'>
        <div class="project-banner-content columns medium-12 clearfix row">
                <span class="project-logo">
                    <a class="no-border" href="{{url}}" target="_blank">
                        <img src="{{logo}}"></a>
                </span>
            <span class="project-text">
                    <span class="project-description">{{description}}</span>
                </span>
        </div>
    </script>
    <!-- Suggested layout containers -->

        <section id="main-content-area" class="row" role="main">
            <div id="menu-popup">
                <div id="login-form" class="popup">
                    <div class="popup-header">
                        <span class="popup-title">Login</span>
                        <a class="popup-close" href="#"><i class="icon icon-functional" data-icon="x"></i></a>
                        <div class="clearboth"></div>
                    </div>
                    <form method="post" class="popup-content" action="${contextPath}/auth" >
                        <input  type="hidden" name="t" value="${request.getHeader(HttpTools.REFERER_HEADER)}"/>
                        <fieldset>
                            <input id="user-field" type="text" name="u" maxlength="50" placeholder="Username"/>
                            <input id="pass-field" type="password" name="p" maxlength="50" placeholder="Password"/>
                        </fieldset>
                        <fieldset>
                            <input id="login-remember" name="r" type="checkbox"/>
                            <label for="login-remember">Remember me</label>
                            <input class="submit button" type="submit" value="Login"/>
                        </fieldset>
                        <div id="login-status" class="alert" style="display:none"></div>
                    </form>
                    <form id="logout-form" method="post" class="popup-content" action="${contextPath}/logout" >
                    </form>
                </div>
            </div>
            <!-- Your menu structure should make a breadcrumb redundant, but if a breadcrumb is needed uncomment the below -->
            <nav aria-label="You are here:">
                <jsp:invoke fragment="breadcrumbs"/>
            </nav>
            <section id='renderedContent'>
                <jsp:doBody/>
            </section>
        </section>
    <!-- End suggested layout containers -->

</div>


<footer>
    <div id="elixir-banner" data-color="grey" data-name="BioStudies" data-description="BioStudies is a recommended ELIXIR Deposition Database" data-more-information-link="https://www.elixir-europe.org/platforms/data/elixir-deposition-databases" data-use-basic-styles="false"></div>
    <script defer="defer" src="https://ebi.emblstatic.net/web_guidelines/EBI-Framework/v1.3/js/elixirBanner.js"></script>
    <div id="global-footer" class="global-footer">
        <nav id="global-nav-expanded" class="global-nav-expanded row">
            <!-- Footer will be automatically inserted by footer.js -->
        </nav>
        <section id="ebi-footer-meta" class="ebi-footer-meta row">
            <!-- Footer meta will be automatically inserted by footer.js -->
        </section>
    </div>
</footer>


<!-- JavaScript -->

<!-- Grab Google CDN's jQuery, with a protocol relative URL; fall back to local if offline -->
<!--
<script>window.jQuery || document.write('<script src="../js/libs/jquery-1.10.2.min.js"><\/script>')</script>
-->
<script src="${contextPath}/js/jquery-3.2.0.min.js"></script>
<!-- Your custom JavaScript file scan go here... change names accordingly -->
<!--
<script defer="defer" src="//www.ebi.ac.uk/web_guidelines/js/plugins.js"></script>
<script defer="defer" src="//www.ebi.ac.uk/web_guidelines/js/script.js"></script>
-->
<script defer="defer" src="//www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/js/script.js"></script>
<script defer src="${contextPath}/js/fontawesome-all.min.js"></script>

<!-- The Foundation theme JavaScript -->
<script src="//www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/libraries/foundation-6/js/foundation.js"></script>
<script src="//www.ebi.ac.uk/web_guidelines/EBI-Framework/v1.2/js/foundationExtendEBI.js"></script>
<script>$(document).foundation();</script>
<script>$(document).foundationExtendEBI();</script>

<script src='${contextPath}/js/handlebars-v4.0.5.js'></script>
<script src='${contextPath}/js/jquery.cookie.js'></script>
<script src='${contextPath}/js/jquery.caret-range-1.0.js'></script>
<script src='${contextPath}/js/jquery.autocomplete.js'></script>

<!-- shared variables -->
<script>
    var contextPath = '${contextPath}';
    var parts = $.grep('${pathname}'.replace(contextPath+'/','').split('/'),function(a) {return a!=''});
    var project = parts.length>1 && parts[0].toLowerCase()!='studies' ? parts[0] : undefined;
</script>
<script src='${contextPath}/js/common.js'></script>
<!-- Google Analytics details... -->
<!-- Change UA-XXXXX-X to be your site's ID -->
<!--
<script>
  window._gaq = [['_setAccount','UAXXXXXXXX1'],['_trackPageview'],['_trackPageLoadTime']];
  Modernizr.load({
    load: ('https:' == location.protocol ? '//ssl' : '//www') + '.google-analytics.com/ga.js'
  });
</script>
-->
<jsp:invoke fragment="postBody"/>

<script id='error-template' type='text/x-handlebars-template'>
    <section>
        <h3 class="alert"><i class="icon icon-generic padding-right-medium" data-icon="l"></i>{{title}}</h3>
        <p>{{&message}}</p>
        <p>If you require further assistance locating missing page or file, please <a
                href="mailto://biostudies@ebi.ac.uk" class="feedback">contact us</a> and we will look into it
            for you.</p>
    </section>
</script>
</body>
</html>

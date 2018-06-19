!function(d) {
    var params = document.location.search.replace(/(^\?)/,'').split("&").map(
        function(s) {
            return s = s.split("="), this[s[0]] = s[1], this
        }.bind({}))[0];
    DetailRenderer.init(params);
    var url = window.location.pathname;
    url = url.replace('/studies/','/api/v1/studies/').replace(project,'');
    $.getJSON(url,params, function (data) {
        if (!data.accno && data.submissions) {
            data = data.submissions[0];
        }
        DetailRenderer.render(data);
    }).fail(function(error) {
        showError(error);
    });
}(document);


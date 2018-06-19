// create links for sample number
/*$(DetailRenderer.sectionTables).each(function () {
    var sampleColumn =  this.columns(function(i,d,n){ return $(n).text()=='No. of Samples' });
    if (!sampleColumn || !sampleColumn.length ||!sampleColumn.nodes()[0] ||  !sampleColumn.nodes()[0].length) return;
    $(sampleColumn.nodes()[0]).each( function(i,v) {
        var id = generatedID++;
        $(v).wrapInner('<a id="genid' +  id  + '" name="genid'+ id +'" href="#"></a>');
        $('a',v).attr('data-file-data-search',$(v).siblings().map(function(){ return $(this).text(); }).toArray().join(' '));
    })

});*/
$('a[data-file-data-search]').click( function () {
    expansionSource = ''+$(this).attr('id');
    DetailRenderer.clearFileFilter();
    $('#all-files-expander').click();
    DetailRenderer.filesTable.search($(this).data('file-data-search'));
    // hide empty columns
    DetailRenderer.filesTable.columns().every(function(){ if (filesTable.cells({search:'applied'},this).data().join('').trim()=='') this.visible(false) });
    DetailRenderer.filesTable.draw();
    return false;
})

// format MIAME/MinSeq scores
var $miameTitleDiv = $('.bs-name:contains("MIAME Score")');
if ($miameTitleDiv.text().trim().toLowerCase()=='miame score') {
    $miameTitleDiv.next().removeClass('has-child-section').css({'column-count':'5', 'width':'33%'});
    $('.bs-name',$miameTitleDiv.next()).toggleClass('bs-name miame-score-title');
    $('.miame-score-title').css('text-align','center').next().css('text-align','center').each(function() {
        $(this).html($(this).text().trim()=='*' ? '<i class="fas fa-asterisk" data-fa-transform="shrink-8"></i>' : '<i class="fas fa-minus" data-fa-transform="shrink-8"></i>' )
    })
}
var $minseqTitleDiv = $('.bs-name:contains("MinSeq Score")');
if ($minseqTitleDiv.text().trim().toLowerCase()=='minseq score') {
    $minseqTitleDiv.next().removeClass('has-child-section').css({'column-count':'5', 'width':'42%'});
    $('.bs-name',$minseqTitleDiv.next()).toggleClass('bs-name minseq-score-title');
    $('.minseq-score-title').css('text-align','center').next().css('text-align','center').each(function() {
        $(this).html($(this).text().trim()=='*' ? '<i class="fas fa-asterisk" data-fa-transform="shrink-8"></i>' : '<i class="fas fa-minus" data-fa-transform="shrink-8"></i>' )
    })
}



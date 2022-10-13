//Listen und Maps für den späteren Gebrauch
const pmidList = [];
const authorList = [];
const citidList = [];
const mapArtCit = new Map();
const mapAuthors = new Map();
const mapArticles = new Map();


// Artikel Klasse, um jeden Artikel zu speichern

class Article{
    constructor(pmid, title, authors, pubdate){
        this.pmid = pmid;
        this.title = title;
        this.authors = authors;
        this.pubdate = pubdate;
        this.citidList = "";
    }

}

class Author{
    constructor(name, workedat){
        this.name = name;
        this.workedat= workedat;
    }
}

async function searchPubMed(term) {
    return $.ajax({
        url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        data: {
            db: 'pubmed',
            usehistory: 'y',
            term: term,
            retmode: 'json',
            retmax: 500
        }
    });
}

function fetchResults(response) {
    return $.ajax({
        url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
        data: {
            db: 'pubmed',
            usehistory: 'y',
            webenv: response.esearchresult.webenv,
            query_key: response.esearchresult.querykey,
            retmode: 'xml',
            retmax: 500 // how many items to return
        }
    });
}

function parseResults(response) {
    var nodes = response.querySelectorAll('DocSum');

    return $.map(nodes, function(node) {
        var pmidNode = node.querySelector('Id');
        var doiNode = node.querySelector('Item[Name=DOI]');
        var titleNode = node.querySelector('Item[Name=Title]');
        var sourceNode = node.querySelector('Item[Name=Source]');
        var epubDateNode = node.querySelector('Item[Name=EPubDate]');
        var pubDateNode = node.querySelector('Item[Name=PubDate]');
        var authorNodes = node.querySelectorAll('Item[Name=AuthorList] > Item[Name=Author]');
        

        return {
            title: titleNode ? titleNode.textContent : null,
            pmid: pmidNode ? pmidNode.textContent : null,
            source: sourceNode ? sourceNode.textContent : null,
            pubdate: pubDateNode ? pubDateNode.textContent : null,
            authors: $.map(authorNodes, function(authorNode) {
                return authorNode.textContent;
            }),
            url: doiNode ? 'http://dx.doi.org/' + encodeURIComponent(doiNode.textContent) : 'http://pubmed.gov/' + pmidNode.textContent,
            date: epubDateNode && epubDateNode.textContent ? epubDateNode.textContent : pubDateNode.textContent,
            };
        });
    }

function displayResults(articles) {
    var output = $('#output');
    var article_cnt = 0;
    $.each(articles, function (i, article) {
        article_cnt += 1;
        var item = $('<li/>').appendTo(output);
        console.log(article);
        pmidList.push(article.pmid);

        //authorList.append(new Author(article.Author));
        var container = $('<div/>').appendTo(item);
        
        //PMID
        $('<div/>', {
            text: article.pmid
        }).appendTo(item);

        //Titel + Link zum Artikel
        $('<a/>', {
            href: article.url,
            text: article.title,
        }).appendTo(container);

        //Artikeldatum
        $('<div/>', {
            text: article.date
        }).appendTo(item);

        //Autoren
        $('<div/>', {
            text: article.authors.join(', ')
        }).appendTo(item);

        $('<hr width="95%" align="center" height="25px" background-color="blue">').appendTo(item);
    });

    //Gesamtmenge an gefundenen Artikel anzeigen
    console.log(article_cnt);
    const nres = document.getElementById("nresults");
    nres.textContent = article_cnt.toString() + " Artikel gefunden:";
    console.log(pmidList);

    for(i = 0; i < article_cnt; i++){
        citeobj = searchCitation(pmidList[i]);
        //Combine Articles with citations
        var finalObj = $.extend(pmidList[i], citeobj);
        console.log(finalObj);
    }
    
} 

function searchCitation(pmid){
    var request = new XMLHttpRequest();
    request.open(
        "GET",
        [
            "https://icite.od.nih.gov/api",
            "pubs",
            pmid,
        ].join("/")
    );
    request.responseType = "json";
    request.onload = function () {
        console.log(request.response);
        // Map Pubmed ID with the corresponding authors and cititionIDs
        mapAuthors.set(request.response.pmid, request.response.authors);
        mapArticles.set(request.response.pmid, request.response.cited_by);
        //Log PMID-> Author Map and PMID-> CititionsPMID Map
        console.log(mapAuthors);
        console.log(mapArticles);
        return request.response;
    };
    request.send();
}

async function fetchCitation(pmid){
    let dataObject;

    const response = await fetch("https://icite.od.nih.gov/api/pubs?pmids="+ pmid)
        .then(data => data.json())
        .then(data => {
            dataObject = data;
            console.log(data);
            return data;
        })
        .catch(error => {
            dataObject = {};
            console.log(error);
        })    

}

function searchCitArticle(pmid){
    let pubdata = searchPubMed(pmid);
}

function getNumberofResults(){
    return article_cnt;
}
/*
function parseCiteResults(dataObj) {

    return $.map(nodes, function(node) {
        var cit_cntNode = node.querySelector('Item[citation_count]');
        var cityearNode = node.querySelector('Item[Name=citations_per_year]');
        var citedByNode = node.querySelectorAll('Item[Name=cited_by] > Item[Name=Citation]');
        var referencesNode = node.querySelectorAll('Item[Name=references] > Item[Name=Reference]');
        

        return {
            citcnt:  cit_cntNode ? cit_cntNode.textContent : null,
            cityear: cityearNode ? cityearNode.textContent : null,
            citedBy: $.map(citedByNode, function(citedByNode) {
                return citedByNode.textContent;
            }),
            references: $.map(referencesNode, function(referencesNode) {
                return referencesNode.textContent;
            }),
        };
    });
}
*/
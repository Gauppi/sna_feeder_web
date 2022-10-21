//Listen und Maps für den späteren Gebrauch
const pmidList = [];
const authorList = [];
const citidList = [];
let articles = [];

const mapArtCit = new Map();
const mapAuthors = new Map();
const mapArticles = new Map();

const nodes = [];
const links = [];


// Artikel Klasse, um jeden Artikel zu speichern

class Article{

    constructor(pmid, title, authors, pubdate, cited_by){
        this.pmid = pmid;
        this.title = title;
        this.authors = authors;
        this.pubdate = pubdate;
        this.citidList = cited_by;
        console.log("Artikel erstellt");
    }

}

class Author{
    constructor(name, workedat){
        this.name = name;
        this.workedat= workedat;
    }
}

/**
 * Create a connection to the Pubmed Server.
 *
 * @alias searchPubMed
 */
async function searchPubMed(term) {
    articles = [];
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

/**
 * Fetch the data from Pubmed. The response will be a JSON Format.
 *
 * @alias fetchResults
 */
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
    const tab = $('#tab'); 

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
    //console.log(article_cnt);
    const nres = document.getElementById("nresults");
    nres.textContent = article_cnt.toString() + " Artikel gefunden:";
    //console.log(pmidList);

    for(i = 0; i < article_cnt; i++){
        citeobj = searchCitation(pmidList[i]);
        //Combine Articles with citations
        var finalObj = $.extend(pmidList[i], citeobj);
        console.log(finalObj);
    }
    console.log("Finito");
    console.log(articles);
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
        let art = new Article(request.response.pmid, request.response.title, request.response.authors, request.response.pubdate, request.response.cited_by);
        articles.push(art);
        // Map Pubmed ID with the corresponding authors and cititionIDs
        mapAuthors.set(request.response.pmid, request.response.authors);
        mapArticles.set(request.response.pmid, request.response.cited_by);
        //Log PMID-> Author Map and PMID-> CititionsPMID Map
        //console.log(mapAuthors);
        //console.log(mapArticles);
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


const a = new Article();
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

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("miserables.json", function(error, graph) {
  if (error) throw error;

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")

  var circles = node.append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { return color(d.group); });

  // Create a drag handler and append it to the node object instead
  var drag_handler = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

  drag_handler(node);
  
  var lables = node.append("text")
      .text(function(d) {
        return d.id;
      })
      .attr('x', 6)
      .attr('y', 3);

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
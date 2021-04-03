let request = require("request");
let cheerio = require("cheerio");
let PDFDocument = require('pdfkit');
let fs = require("fs");
let path = require("path");

let url = "https://github.com/topics";
request(url, cb);
function cb(err, response, html){
    if(err) {
        console.log(err);
    }else{
        getRepoLinks(html);
    }
}
function getRepoLinks(html){
    let selTool = cheerio.load(html);
    let topicBox = selTool(".col-12.col-sm-6.col-md-4.mb-4 a");
    for(let i = 0; i < topicBox.length; i++){
        let topicNm = selTool(topicBox[i]).attr("href");
        let fullLink = "https://github.com" + topicNm;
        // console.log(fullLink);
        processRepoPage(fullLink);
    }
}    
function processRepoPage(fullLink){
    request(fullLink, cb);
    function cb(err, resp, html){
        if(err){
            console.log(err);
        }
        else{
            extractRepoName(html);
        }
    }
}
function extractRepoName(html){
    let selTool = cheerio.load(html);
    let topicNmElem = selTool(".h1-mktg");
    let repoLinks = selTool("a.text-bold");
    // console.log(topicNmElem.text());
    let topicNm = topicNmElem.text().trim();
    topicFolder(topicNm);
    for(let i = 0; i < 8; i++){
        let repoPageLink = selTool(repoLinks[i]).attr("href");
        let repoName = repoPageLink.split("/").pop();
        repoName = repoName.trim();
        console.log(repoName);
        // repoFolder(repoName, topicNm);
        let fullRepoLink = "https://github.com" + repoPageLink + "/issues";
        getIssues(repoName, topicNm, fullRepoLink);
        // console.log(repoPgLinkFull);
    }
    console.log("`````````````````````````````````````````");
}
function getIssues(repoName, topicNm, repoPageLink){
    request(repoPageLink, cb);
    function cb(err, resp, html){
        if(err){
            if(resp.statusCode == 404){
                console.log("No issues page found");
            }
            else{
                console.log(err);
            }
        }else{
            extractIssues(html, repoName, topicNm);
        }
    }
}
function extractIssues(html, repoName, topicNm){
    let selTool = cheerio.load(html);
    let issuesAncArr = selTool("a.Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title");
    let arr = [];
    for(let i = 0; i < issuesAncArr.length; i++){
        let name = selTool(issuesAncArr[i]).text();
        let link = selTool(issuesAncArr[i]).attr("href");
        arr.push({
            "Name": name,
            "Link": "https://github.com" + link
        })
    }
    let filePath = path.join(__dirname, topicNm, repoName + ".pdf");
    let pdfDoc = new PDFDocument;
    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.text(JSON.stringify(arr));
    pdfDoc.end();
}
// function to create folders of topic name
function topicFolder(topicNm){
    let pathOfFolder = path.join(__dirname, topicNm);
    if(!fs.existsSync(pathOfFolder)){
        fs.mkdirSync(pathOfFolder);
    }
}
// function to create JSON file for repo inside Topic name
function repoFolder(repoName, topicNm){
    let pathOfFile = path.join(__dirname, topicNm, repoName + ".JSON");
    if(!fs.existsSync(pathOfFile)){
        let createStream = fs.createWriteStream(pathOfFile);
        createStream.end();
    }
}
/*
Get last traded price for the futures and save to the database
This needs to be refreshed for every new strangle generation
*/

const axios = require("axios");
const chalk = require("chalk");
const cheerio = require("cheerio");
const _ = require("lodash");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const connection = require("./dbConnection");


let url = 'https://www1.nseindia.com/live_market/dynaContent/live_watch/fomwatchsymbol.jsp';
let headers = {
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36',
    'Sec-Fetch-User': '?1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
};
let futures = [];
let scrips = [];


async function getFuture(scrip) {
    await axios({
        url: url,
        params: {
            "key": scrip,
            "Fut_Opt": "Futures"
        },
        headers: headers,
        method: 'GET',
        responseType: 'document'
    })
    .then((response) => {
        extractData(scrip, response.data);
    })
    .catch((error) => {
        console.log(error);
    })
}

function extractData(scrip, html) {
    const $ = cheerio.load(html);
    const selector = ".tabular_data_live_analysis > table > tbody > tr:not(:first)";

    _.forEach($(selector).get(), row => {
        let record = {
            'scrip': scrip,
            'expiryDate': formatDate($(row).children("td:nth-child(3)").text().trim()),
            'lastTradedPrice': $(row).children("td:nth-child(10)").text().trim().replace(',', '') * 1
        };
        futures.push(record);
    });
}

function formatDate(string) {
    let date = string.slice(0, 2) + '-' + string.slice(2, 5) + '-' + string.slice(5);
    return new Date(date).toISOString().split('T')[0];
}

async function loadFutures() {
    const startTime = Date.now();

    const db = await open({
        filename: connection.DB_PATH,
        driver: sqlite3.Database
    });

    const scripsQuery = `select fb.Symbol from FoBhavcopy fb
                            group by fb.Symbol 
                            order by SUM(fb.ValueInLakhs) DESC 
                            limit 50`;
    
    scrips = await db.all(scripsQuery, []);
    
    await Promise.all(scrips.map((x) => getFuture(x.Symbol)));

    db.run("delete from future");
    //db.run("begin transaction");

    futures.forEach((item) => {
        let query = `INSERT INTO future (Scrip, ExpiryDate, LastTradedPrice) values ('${item.scrip}', '${item.expiryDate}', ${item.lastTradedPrice})`;
        //console.log(query);
        db.run(query);
    });

    //db.run("commit");

    await db.close();
    console.log(`Fetched and saved ${chalk.blueBright(futures.length)} futures in ${chalk.cyanBright((Date.now() - startTime)/1000)}s`);
}

//loadFutures();

module.exports = {
    loadFutures
};

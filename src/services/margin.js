//Scrape margin values from https://zerodha.com/margin-calculator/Futures/
//and save to database in margin table

const axios = require("axios");
const _ = require("lodash");
const cheerio = require("cheerio");
const connection = require("./dbConnection");
const chalk = require("chalk");

async function getMargin() {
    await axios({
        url: 'https://zerodha.com/margin-calculator/Futures/',
        method: 'GET',
        responseType: 'document'
    })
    .then((response) => {
        extractData(response.data);
    })
    .catch((error) => {
        console.log(error);
    })
}

function extractData(html) {
    const startTime = Date.now();
    const $ = cheerio.load(html); 
    const db = connection.getDatabase(); 

    const length = $("#table > tbody > tr").length;
    //const queries = []; 

    db.run("begin transaction");
    db.run("delete from margin");
    
    _.forEach($('#table > tbody > tr').get(), row => {
        let contract = $(row).attr('data-scrip');
        let expiryDate = new Date($(row).attr('data-expiry')).toISOString().split('T')[0];
        let lotSize = $(row).attr('data-lot_size') * 1;
        let price = $(row).attr('data-price') * 1;
        let normalMargin = $(row).attr('data-nrml_margin') * 1;
        let misMargin = $(row).attr('data-mis_margin') * 1;
        let limits = $(row).children('td').first().children('div').last().children('span').text().trim().replace('%', '') * 1;

        let query = `INSERT INTO margin (Contract, ExpiryDate, LotSize, Price, NormalMargin, MisMargin, PositionLimits)
                    values ('${contract}', '${expiryDate}', ${lotSize}, ${price}, ${normalMargin}, ${misMargin}, ${limits})`;
        //console.log(query);
        //queries.push(query);

        db.run(query);
    });

    db.run("commit");
    connection.closeDatabase(function() {
        console.log(`Time taken to extract and load ${chalk.blueBright(length)} records - ${chalk.cyanBright((Date.now() - startTime)/1000)}s`);
        //console.log(`Queries created - ${chalk.greenBright(queries.length)}`);
    })
}

//getMargin();
module.exports = {
    getMargin
};
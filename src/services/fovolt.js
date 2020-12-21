const axios = require("axios");
const appRoot = require("app-root-path");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const fs = require("fs");
const csv = require("csv-parser");
const _ = require("lodash");
const sqlite3 = require("sqlite3").verbose();
const chalk = require("chalk");

const csvPath = path.join(appRoot.path, "downloads", "files", "fovolt.csv");
const DB_PATH = path.join((appRoot.path, "database/strangler.db"));
const results = [];
const symbol = " Symbol";
const annualised_volatility = " Applicable Annualised Volatility (N) = Max (F or L)";

function getUri() {
    let uri = "https://www1.nseindia.com/archives/nsccl/volt/FOVOLT_";

    const date = getPreviousTradingDate(dayjs.utc());
    const year = date.format("YYYY");
    const month = date.format("MM").toUpperCase();
    const day = date.format("DD");

    uri += day + month + year + ".csv";
    return uri;
}

function getPreviousTradingDate(date) {
    const thisDate = dayjs(date).add(-1, "d");
    const day = thisDate.format("d");
    if (day == 6 || day == 0) return getPreviousTradingDate(thisDate);

    return thisDate;
}

async function fetchFovolt() {
    await axios({
        url: getUri(),
        method: "GET",
        headers: { "user-agent": "Mozilla/5.0" },
        responseType: "stream",
    })
        .then((response) => {
            response.data.pipe(fs.createWriteStream(csvPath));
        })
        .catch((error) => {
            console.log(error);
        });
}

function readFovolt() {
    const reader = fs.createReadStream(csvPath);
    reader.pipe(csv())
        .on("data", (data) => {
            results.push(data);
        }).on("end", () => {
            uploadToDatabase();
        }).on("error", (error) => {
            console.log(error);
        })
}

function uploadToDatabase() {
    let startTime = Date.now();
    
    let db = new sqlite3.Database(DB_PATH);
    
    db.run("DELETE FROM fovolt");
    db.run("Begin transaction");

    _.forEach(results, row => {
        let query = `INSERT INTO fovolt (CopyDate, Symbol, AnnualisedVolatility) VALUES ("${row.Date}", "${row[symbol]}", ${row[annualised_volatility]*1})`;
        console.log(query);
        db.run(query);        
    });

    setTimeout(function() {
        db.run("commit");
        db.close(function() {
            console.log(`Time taken to upload ${chalk.blueBright(results.length)} records - ${chalk.cyanBright((Date.now() - startTime))}ms`);
        });
    }, 1000);
}

async function loadFovolt() {
    await fetchFovolt();
    setTimeout(readFovolt, 2000);
}

//loadFovolt();

module.exports.loadFovolt = loadFovolt;


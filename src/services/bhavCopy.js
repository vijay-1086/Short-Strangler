const axios = require("axios");
const appRoot = require("app-root-path");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const unzipper = require("unzipper");
const csv = require("csv-parser");
const fs = require("fs");
const _ = require("lodash");
const debug = require("debug")("bhavCopy");
const chalk = require("chalk");
const connection = require("./dbConnection");

const CSV_PATH = path.join(appRoot.path, "downloads/files");
let fileName;
let results = [];

function getUri() {
    let uri = "https://www1.nseindia.com/content/historical/DERIVATIVES";

    const date = getPreviousTradingDate(dayjs.utc());
    const year = date.format("YYYY");
    const month = date.format("MMM").toUpperCase();
    const day = date.format("DD");
    zipName = path.join(CSV_PATH, "/fo" + day + month + year + "bhav.csv.zip");
    fileName = path.join(CSV_PATH, "/fo" + day + month + year + "bhav.csv");
    uri += "/" + year + "/" + month + "/fo" + day + month + year + "bhav.csv.zip";

    return uri;
}

function getPreviousTradingDate(date) {
    const thisDate = dayjs(date).add(-1, "d");
    const day = thisDate.format("d");
    if (day == 6 || day == 0) return getPreviousTradingDate(thisDate);

    return thisDate;
}

function deleteFiles() {
    fs.readdir(CSV_PATH, (error, files) => {
        if (error)
            console.log(error);

        for (const file of files) {
            fs.unlink(path.join(CSV_PATH, file), err => {
                if (err)
                    console.log(err);
            })
        }
    });
}

async function fetchBhavcopy() {
    await axios({
        url: getUri(),
        method: 'GET',
        headers: { "user-agent": "Mozilla/5.0" },
        responseType: "stream"
    })
        .then((response) => {
            response.data.pipe(unzipper.Extract({ path: CSV_PATH }));
        })
        .catch((error) => {
            console.log(error);
        });
}

function readBhavcopy() {
    const reader = fs.createReadStream(fileName);
    reader.pipe(csv())
        .on("data", (data) => {
            results.push(data);
        }).on("end", () => {
            debug(`Length of bhavcopy collection = ${chalk.bgCyanBright(results.length)}`);
            uploadToDatabase();
        }).on("error", (error) => {
            console.log(error);
        });
}

function uploadToDatabase() {      
    let startTime = Date.now();
    
    let db = connection.getDatabase();
    db.run("DELETE FROM FoBhavcopy");
    db.run("Begin transaction");

    _.forEach(results, row => {
        let query = `INSERT INTO FoBhavcopy (Instrument, Symbol, ExpiryDate, StrikePrice, OptionType, OpenPrice, HighPrice, 
                    LowPrice, ClosePrice, SettlePrice, Contracts, ValueInLakhs, OpenInterest, ChangeInOI, CopyDate)
                        VALUES ("${row.INSTRUMENT}", "${row.SYMBOL}", "${new Date(row.EXPIRY_DT).toISOString().split('T')[0]}", ${row.STRIKE_PR}, "${row.OPTION_TYP}", ${row.OPEN}, ${row.HIGH}, ${row.LOW}, 
                        ${row.CLOSE}, ${row.SETTLE_PR}, ${row.CONTRACTS}, ${row.VAL_INLAKH}, ${row.OPEN_INT}, ${row.CHG_IN_OI}, "${new Date(row.TIMESTAMP).toISOString().split('T')[0]}")`;
        db.run(query);
    });

    db.run("commit");
    connection.closeDatabase(function() {
        console.log(`Time taken to upload ${chalk.blueBright(results.length)} records - ${chalk.cyanBright((Date.now() - startTime)/1000)}s`);
    })    
}

async function loadBhavcopy() {
    deleteFiles();
    await fetchBhavcopy();

    setTimeout(readBhavcopy, 1000);
}

//loadBhavcopy();
module.exports = {
    loadBhavcopy
};

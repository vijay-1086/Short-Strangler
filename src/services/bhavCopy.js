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

// Todo: Load data into database
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
    console.log("files deleted");
}

async function fetchBhavcopy() {
    await axios({
        url: getUri(),
        method: 'GET',
        headers: { "user-agent": "Mozilla/5.0" },
        responseType: "stream"
    })
        .then((response) => {
            console.log("response received");
            response.data.pipe(unzipper.Extract({ path: CSV_PATH }));
            console.log("file extracted");
        })
        .catch((error) => {
            console.log(error);
        });
}

function readBhavcopy() {
    console.log("Read start");
    const reader = fs.createReadStream(fileName);
    reader.pipe(csv())
        .on("data", (data) => {
            results.push(data);
        }).on("end", () => {
            console.log(results.length);
            console.log(_.last(results));
        }).on("error", (error) => {
            console.log(error);
        })
}


async function loadBhavcopy() {
    deleteFiles();
    await fetchBhavcopy();

    setTimeout(readBhavcopy, 1000);
    console.log("method end");
}

loadBhavcopy();

//module.exports.loadBhavCopy = loadBhavCopy;

const axios = require("axios");
const appRoot = require("app-root-path");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const fs = require("fs");
const csv = require("csv-parser");
const _ = require("lodash");

const csvPath = path.join(appRoot.path, "downloads", "fovolt.csv");
const results = [];

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
            //console.log(`Status: ${response.status}, Status Text: ${response.statusText}, data: ${response.data}`)
            response.data.pipe(fs.createWriteStream(csvPath));
        })
        .catch((error) => {
            console.log(error);
        });
}

function readFovolt() {
    console.log("Read start");
    const reader = fs.createReadStream(csvPath);
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

async function loadFovolt() {
    await fetchFovolt();
    setTimeout(readFovolt, 1000);
}

loadFovolt();


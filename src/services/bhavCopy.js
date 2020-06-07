const axios = require("axios");
const appRoot = require("app-root-path");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const unzipper = require("unzipper");

const csvPath = path.join(appRoot.path, "downloads");

function getUri() {
  let uri = "https://www1.nseindia.com/content/historical/DERIVATIVES";

  const date = getPreviousTradingDate(dayjs.utc());
  const year = date.format("YYYY");
  const month = date.format("MMM").toUpperCase();
  const day = date.format("DD");

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

function fetchBhavCopy() {
  return axios({
    url: getUri(),
    method: "GET",
    headers: { "user-agent": "Mozilla/5.0" },
    responseType: "stream",
  })
    .then(function (response) {
      response.data.pipe(unzipper.Extract({ path: csvPath }));
    })
    .catch((error) => {
      console.log(error);
    });
}

fetchBhavCopy();
//module.exports.loadBhavCopy = loadBhavCopy;

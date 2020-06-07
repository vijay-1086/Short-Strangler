const axios = require("axios");
const appRoot = require("app-root-path");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const fs = require("fs");

const csvPath = path.join(appRoot.path, "downloads", "fovolt.csv");

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

function fetchFovolt() {
  return axios({
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

fetchFovolt();

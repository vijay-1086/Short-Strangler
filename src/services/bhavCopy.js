const axios = require('axios')
const fs = require('fs')
const appRoot = require('app-root-path')
const path = require('path');

const uri = 'https://www1.nseindia.com/content/historical/DERIVATIVES/2020/MAY/fo29MAY2020bhav.csv.zip'
const writer = fs.createWriteStream('C:/Users/vijay/Documents/VG/Strangler-New/Short-Strangler/downloads/bhavcopy.csv.zip')

// Todo: Dymanic url based on date
// Todo: Load data into database

function loadBhavCopy() {
    return axios({
        url: uri,
        method: 'GET',
        headers: { 'user-agent': 'Mozilla/5.0' },
        responseType: 'stream'
    })
    .then(function(response) {
        response.data.pipe(writer)
    })
    .catch(error => {
        console.log(error)
    })
}

loadBhavCopy();
//module.exports.loadBhavCopy = loadBhavCopy;
/*
Get top 50 instruments based on "valueinlakh" in BhavCopy
Get the next 2 months' expiry dates
For those 50 instruments get the option chain for the next 2 months
Save the option chains to the database 
*/

const axios = require("axios");
const _ = require("lodash");

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
}

function getOptionChain() {
    console.log("function start");
    let url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";
    axios.get(url, { "headers": headers, "timeout": 2000 })
    .then(response => {
        console.log("Call succeeded");
        let result = response.data.records.data;
        let optionChain = _.filter(result, option => { return option.expiryDate == "31-Dec-2020"; })
        console.log(optionChain.length);        
        console.log(_.first(optionChain));
        console.log(_.last(optionChain));
    })
    .catch(error => {
        console.log("Call errored");
        console.log(error);
    });    
}

getOptionChain();
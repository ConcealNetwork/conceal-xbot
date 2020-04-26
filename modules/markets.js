const fs = require('fs');
const shortid = require('shortid');
const request = require("request");

module.exports = {
  getExchanges: function () {
    return new Promise((resolve, reject) => {
      var packetData = {
        uri: "https://explorer.conceal.network/services/exchanges/list",
        strictSSL: false,
        method: "GET",
        json: true
      };

      request(packetData, function (err, res, data) {
        if (!err) resolve(data);
        else reject(err);
      });
    });
  },
  getMarketInfo: function () {
    return new Promise((resolve, reject) => {
      var packetData = {
        uri: "https://api.coingecko.com/api/v3/simple/price?ids=conceal&vs_currencies=eth%2Cbtc%2Cusd%2Ceur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true",
        strictSSL: false,
        method: "GET",
        json: true
      };

      request(packetData, function (err, res, data) {
        if (!err) resolve(data);
        else reject(err);
      });
    });
  },
  getPriceChart: function () {
    return new Promise((resolve, reject) => {
      let url = "https://explorer.conceal.network/services/charts/price.png";
      let filename = `./images/${shortid.generate()}.png`;

      request.head(url, (err, res, body) => {
        request(url)
          .pipe(fs.createWriteStream(filename))
          .on('close', function () {
            resolve(filename);
          });
      });
    });
  }
};
const request = require("request");

module.exports = {
  getExchanges: function (resultCallback) {
    var packetData = {
      uri: "https://explorer.conceal.network/services/exchanges/list",
      strictSSL: false,
      method: "GET",
      json: true
    };

    request(packetData, function (err, res, data) {
      if (!err) {
        resultCallback(data);
      }
    });
  },
  getMarketInfo: function (resultCallback) {
    var packetData = {
      uri: "https://api.coingecko.com/api/v3/simple/price?ids=conceal&vs_currencies=eth%2Cbtc%2Cusd%2Ceur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true",
      strictSSL: false,
      method: "GET",
      json: true
    };

    request(packetData, function (err, res, data) {
      if (!err) {
        resultCallback(data);
      }
    });
  }
};
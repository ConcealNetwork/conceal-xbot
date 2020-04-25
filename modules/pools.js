const request = require("request");

module.exports = {
  getPoolsList: function () {
    return new Promise((resolve, reject) => {
      var packetData = {
        uri: "https://explorer.conceal.network/services/pools/list",
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
  getPoolsInfo: function () {
    return new Promise((resolve, reject) => {
      var packetData = {
        uri: "https://explorer.conceal.network/services/pools/data",
        strictSSL: false,
        method: "GET",
        json: true
      };

      request(packetData, function (err, res, data) {
        if (!err) resolve(data);
        else reject(err);
      });
    });
  }
};
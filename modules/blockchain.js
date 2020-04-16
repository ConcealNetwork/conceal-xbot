const config = require("../config.json");
const request = require("request");

module.exports = {
  getInfo: function (resultCallback) {
    var packetData = {
      uri: `${config.daemon.api}/getinfo`,
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
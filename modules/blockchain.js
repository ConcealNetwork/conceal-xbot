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
  },
  getLastHeaderInfo: function (resultCallback) {
    var packetData = {
      uri: `${config.daemon.api}/json_rpc`,
      strictSSL: false,
      method: "POST",
      json: true,
      json: {
        "jsonrpc": "2.0",
        "id": "concealBot",
        "method": "getlastblockheader"
      }
    };

    request(packetData, function (err, res, header) {
      if (!err) {
        packetData.json = {
          "jsonrpc": "2.0",
          "id": "concealBot",
          "method": "f_block_json",
          "params": {
            "hash": header.result.block_header.hash
          }

        }

        request(packetData, function (err, res, data) {
          if (!err) {
            resultCallback(data);
          }
        });
      }
    });

  }
};
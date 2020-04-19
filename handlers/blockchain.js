const fs = require('fs');
const Handlebars = require("handlebars");
const blockchain = require("../modules/blockchain.js");

module.exports = {
  executeCommand: function (message, command, args) {
    if (args[0] == "supply") {
      blockchain.getLastHeaderInfo(function (data) {
        let Supply = Numeral(data.result.block.alreadyGeneratedCoins / config.metrics.coinUnits);
        message.channel.send(`***Current supply is is***: ${Supply.format('0,0')} CCX`);
        console.log(data);
      });
    }

    if (args[0] == "height") {
      blockchain.getInfo(function (data) {
        message.channel.send(`***Blockchain height is***: ${data.height}`);
      });
    }
  }
};
const fs = require('fs');
const Handlebars = require("handlebars");
const markets = require("../modules/markets.js");

module.exports = {
  executeCommand: function (message, command, args) {
    if (args[0] == "info") {
      // get the basic data for the exchanges we support
      markets.getExchanges(function (data) {
        fs.readFile('./templates/exchanges.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          message.channel.send(template(data));
        });
      });
    }

  }
};
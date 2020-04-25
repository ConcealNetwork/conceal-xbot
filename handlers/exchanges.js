const fs = require('fs');
const Handlebars = require("handlebars");
const markets = require("../modules/markets.js");

module.exports = {
  executeCommand: function (message, command, args) {
    if (args[0] == "info") {
      // get the basic data for the exchanges we support
      markets.getExchanges().then(data => {
        fs.readFile('./templates/exchanges.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          marketsEmbed = {
            color: 0x0099ff,
            title: 'Conceal Exchanges',
            url: 'https://conceal.network',
            author: {
              name: 'Conceal Network',
              icon_url: 'https://conceal.network/images/branding/logo.png',
              url: 'https://discord.gg/YbpHVSd'
            },
            fields: JSON.parse(template(data)),
            timestamp: new Date(),
            footer: {
              text: 'Privacy by default',
              icon_url: 'https://conceal.network/images/branding/logo.png'
            },
          };

          message.channel.send({ embed: marketsEmbed });
        });
      }).catch(err => {
        message.channel.send(err);
      });
    }
  }
};
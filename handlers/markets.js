const fs = require('fs');
const Handlebars = require("handlebars");
const markets = require("../modules/markets.js");

module.exports = {
  executeCommand: function (message, command, args) {
    if (args[0] === "help") {

      fs.readFile('./templates/help_markets.msg', 'utf8', function (err, source) {
        if (err) throw err;
        var template = Handlebars.compile(source);
        message.channel.send(template(template));
      });
    }

    if (args[0] == "info") {
      // get the basic markets info
      markets.getMarketInfo().then(data => {
        fs.readFile('./templates/market.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          marketsEmbed = {
            color: 0x0099ff,
            title: 'Conceal | CCX',
            url: 'https://conceal.network',
            author: {
              name: 'Conceal Network',
              icon_url: 'https://conceal.network/images/branding/logo.png',
              url: 'https://discord.gg/YbpHVSd'
            },
            fields: [
              {
                name: 'Market prices and data',
                value: template(data)
              },
            ],
            timestamp: new Date(),
            footer: {
              text: 'Privacy by default',
              icon_url: 'https://conceal.network/images/branding/logo.png'
            },
          };

          // send resply back to the channel
          message.channel.send({ embed: marketsEmbed });
        });
      }).catch(err => {
        message.channel.send(err);
      });
    }
  }
};
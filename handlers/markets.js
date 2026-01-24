const fs = require('fs');
const Handlebars = require('handlebars');
const markets = require('../modules/markets.js');
const utils = require('../helpers/utils.js');

let availableCommands = ['help', 'info', 'pricechart'];

module.exports = {
  executeCommand: function (message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send(
        'Unknown markets command. Type ".markets help" for available commands'
      );
    }

    if (args[0] === 'help') {
      fs.readFile('./templates/help_markets.msg', 'utf8', function (err, source) {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if (args[0] == 'info') {
      // get the basic markets info
      markets
        .getMarketInfo()
        .then((data) => {
          fs.readFile('./templates/market.msg', 'utf8', function (err, source) {
            if (err) throw err;

            var template = Handlebars.compile(source);
            let marketsEmbed = {
              color: 0x0099ff,
              title: 'Conceal | CCX',
              url: 'https://conceal.network',
              author: {
                name: 'Conceal Network',
                icon_url: 'https://conceal.network/images/branding/logo.png',
                url: 'https://discord.gg/YbpHVSd',
              },
              fields: [
                {
                  name: 'Market prices and data',
                  value: template(data),
                },
              ],
              timestamp: new Date(),
              footer: {
                text: 'Privacy by default',
                icon_url: 'https://conceal.network/images/branding/logo.png',
              },
            };

            // send resply back to the channel
            message.channel.send({ embeds: [marketsEmbed] });
          });
        })
        .catch((err) => {
          message.channel.send(`Failed to get markets data: ${err}`);
        });
    }

    if (args[0] == 'pricechart') {
      markets
        .getPriceChart()
        .then((filename) => {
          message.channel.send({
            content: 'CCX price chart',
            files: [{ attachment: filename, name: 'pricechart.png' }]
          });
        })
        .catch((err) => {
          message.channel.send(`Failed to get price chart: ${err}`);
        });
    }
  },
};

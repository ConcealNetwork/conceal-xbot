const fs = require('fs');
const Handlebars = require('handlebars');
const utils = require('../helpers/utils.js');
const markets = require('../modules/markets.js');

const availableCommands = ['help', 'info', 'volume'];

module.exports = {
  executeCommand: (message, command, args) => {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send(
        'Unknown exchanges command. Type ".exchanges help" for available commands'
      );
    }

    if (args[0] === 'help') {
      fs.readFile('./templates/help_exchanges.msg', 'utf8', (err, source) => {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if (args[0] == 'info') {
      // get the basic data for the exchanges we support
      markets
        .getExchanges()
        .then((data) => {
          fs.readFile('./templates/exchanges.msg', 'utf8', (err, source) => {
            if (err) throw err;

            var template = Handlebars.compile(source);
            const marketsEmbed = {
              color: 0x0099ff,
              title: 'Conceal Exchanges',
              url: 'https://conceal.network',
              author: {
                name: 'Conceal Network',
                icon_url: 'https://conceal.network/images/branding/logo.png',
                url: 'https://discord.gg/YbpHVSd',
              },
              fields: JSON.parse(template(data)),
              timestamp: new Date(),
              footer: {
                text: 'Privacy by default',
                icon_url: 'https://conceal.network/images/branding/logo.png',
              },
            };

            // send the embed back to the channel as message
            message.channel.send({ embeds: [marketsEmbed] });
          });
        })
        .catch((err) => {
          message.channel.send(`Failed to get exchanges: ${err}`);
        });
    }

    if (args[0] == 'volume') {
      // get the volume data for the exchanges
      markets
        .getExchangesVolume()
        .then((data) => {
          fs.readFile('./templates/exchanges_volume.msg', 'utf8', (err, source) => {
            if (err) throw err;

            var template = Handlebars.compile(source);
            const volumeEmbed = {
              color: 0x0099ff,
              title: 'Conceal Exchanges Volume 24h',
              url: 'https://conceal.network',
              author: {
                name: 'Conceal Network',
                icon_url: 'https://conceal.network/images/branding/logo.png',
                url: 'https://discord.gg/YbpHVSd',
              },
              fields: JSON.parse(template(data)),
              timestamp: new Date(),
              footer: {
                text: 'Privacy by default',
                icon_url: 'https://conceal.network/images/branding/logo.png',
              },
            };

            // send the embed back to the channel as message
            message.channel.send({ embeds: [volumeEmbed] });
          });
        })
        .catch((err) => {
          message.channel.send(`Failed to get exchanges volume: ${err}`);
        });
    }
  },
};

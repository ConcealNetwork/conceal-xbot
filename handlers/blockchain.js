const fs = require('fs');
const Numeral = require('numeral');
const config = require('../config.json');
const Handlebars = require('handlebars');
const blockchain = require('../modules/blockchain.js');

let availableCommands = [
  'help',
  'totalsupply',
  'total',
  'banked',
  'height',
  'reward',
  'hashrate',
  'maxsupply',
  'difficulty',
  'supply',
  'diff',
  'nodecount',
  'smartnodecount',
];

module.exports = {
  executeCommand: function (blockchainInfo, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send(
        'Unknown blockchain command. Type ".blockchain help" for available commands'
      );
    }

    if (args[0] === 'help') {
      fs.readFile('./templates/help_blockchain.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if (args[0] == 'supply') {
      blockchainInfo
        .getLastHeaderInfo()
        .then((headerData) => {
          blockchainInfo
            .getBlockInfo(headerData.hash)
            .then((blockData) => {
              blockchainInfo
                .getInfo()
                .then((infoData) => {
                  let supply = Numeral(
                    (blockData.alreadyGeneratedCoins - infoData.full_deposit_amount) /
                      config.metrics.coinUnits
                  );
                  message.channel.send(
                    `***Circulating supply is is***: ${supply.format('0,0')} CCX`
                  );
                })
                .catch((err) => {
                  message.channel.send(`Failed call getInfo: ${err}`);
                });
            })
            .catch((err) => {
              message.channel.send(`Failed call getBlockInfo: ${err}`);
            });
        })
        .catch((err) => {
          message.channel.send(`Failed call getLastHeaderInfo: ${err}`);
        });
    }

    if (args[0] === 'totalsupply' || args[0] === 'total') {
      blockchainInfo
        .getLastHeaderInfo()
        .then((headerData) => {
          blockchainInfo
            .getBlockInfo(headerData.hash)
            .then((blockData) => {
              let supply = Numeral(blockData.alreadyGeneratedCoins / config.metrics.coinUnits);
              message.channel.send(`***Total supply is is***: ${supply.format('0,0')} CCX`);
            })
            .catch((err) => {
              message.channel.send(`Failed call getBlockInfo: ${err}`);
            });
        })
        .catch((err) => {
          message.channel.send(`Failed call getLastHeaderInfo: ${err}`);
        });
    }

    if (args[0] === 'banked') {
      blockchainInfo
        .getInfo()
        .then((data) => {
          let banked = Numeral(data.full_deposit_amount / config.metrics.coinUnits);
          message.channel.send(`***Total banked amount is***: ${banked.format('0,0')} CCX`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getInfo: ${err}`);
        });
    }

    if (args[0] === 'height') {
      blockchainInfo
        .getInfo()
        .then((data) => {
          message.channel.send(`***Blockchain height is***: ${data.height}`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getInfo: ${err}`);
        });
    }

    if (args[0] === 'reward') {
      blockchainInfo
        .getLastHeaderInfo()
        .then((data) => {
          let reward = Numeral(data.reward / config.metrics.coinUnits);
          message.channel.send(`***Current reward is***: ${reward.format('0')} CCX`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getLastHeaderInfo: ${err}`);
        });
    }

    if (args[0] === 'hashrate') {
      blockchainInfo
        .getInfo()
        .then((data) => {
          message.channel.send(
            `***Current hashrate is***: ${data.difficulty / config.metrics.blockTargetInterval}`
          );
        })
        .catch((err) => {
          message.channel.send(`Failed call getInfo: ${err}`);
        });
    }

    if (args[0] === 'maxsupply') {
      message.channel.send(`***Max supply is***: 200000000 CCX`);
    }

    if (args[0] === 'difficulty' || args[0] === 'diff') {
      blockchainInfo
        .getInfo()
        .then((data) => {
          message.channel.send(`***Current difficulty is***: ${data.difficulty}`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getInfo: ${err}`);
        });
    }

    if (args[0] === 'nodecount') {
      blockchainInfo
        .getNodeCount()
        .then((data) => {
          message.channel.send(`***Current node count is***: ${data}`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getNodeCount: ${err}`);
        });
    }

    if (args[0] === 'smartnodecount') {
      blockchainInfo
        .getSmartNodeCount()
        .then((data) => {
          message.channel.send(`***Current smart node count is***: ${data}`);
        })
        .catch((err) => {
          message.channel.send(`Failed call getSmartNodeCount: ${err}`);
        });
    }
  },
};

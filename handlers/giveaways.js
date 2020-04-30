const fs = require('fs');
const config = require("../config.json");

module.exports = {
  executeCommand: async function (giveawaysData, walletsData, client, message, command, args) {
    if (args[0] === "help") {

      fs.readFile('./templates/help_giveaways.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if (args[0] === "create") {
      let timespan = parseInt(args[1]);
      let winners = parseInt(args[2]);
      let amount = parseFloat(args[3]);
      let description = args.slice(4).join(" ");

      walletsData.getBalance(message.member.user.id).then(balanceData => {
        if (balanceData.balance > (amount * config.metrics.coinUnits)) {
          const giveawayEmbed = {
            color: 0x0099ff,
            title: description,
            url: 'https://discord.js.org',
            author: {
              name: 'Conceal Network',
              icon_url: 'https://conceal.network/images/branding/logo.png',
              url: 'https://discord.gg/YbpHVSd'
            },
            description: `React with \:tada: to enter. Prize is ${amount} CCX`,
            timestamp: new Date(),
            footer: {
              text: `${winners} winners | ends at ...`,
              icon_url: 'https://conceal.network/images/branding/logo.png'
            }
          };

          // delete the bot command 
          message.delete().catch(O_o => { });

          message.channel.send({ embed: giveawayEmbed }).then(newMsg => {
            giveawaysData.createGiveaway(message.member.user.id, newMsg.id, timespan, winners, amount, description).then(data => {
              newMsg.react('🎉');
            }).catch(err => {
              newMsg.delete().catch(O_o => { });
              message.channel.send(`Error creating giveaway: ${err}`);
            });
          });
        } else {
          message.channel.send(`insuficient balance ${balanceData.balance / config.metrics.coinUnits} CCX`);
        }
      }).catch(err => {
        message.channel.send(err);
      });
    }
  }
}


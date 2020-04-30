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
      let title = args.slice(4).join(" ");

      walletsData.getBalance(message.member.user.id).then(balanceData => {
        if (balanceData.balance > (amount * config.metrics.coinUnits)) {
          const description = `React with \:tada: to enter. Prize is ${amount} CCX`;
          const footer = `${winners} winners | ends at ...`;
          const giveawayEmbed = giveawaysData.createEmbedMessage(title, description, footer);
          message.delete().catch(O_o => { });

          message.channel.send({ embed: giveawayEmbed }).then(newMsg => {
            giveawaysData.createGiveaway(message.member.user.id, newMsg.channel.id, newMsg.id, timespan, winners, amount, title).then(data => {
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


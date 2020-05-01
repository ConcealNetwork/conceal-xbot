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
  },
  finishGiveaway: function (giveawaysData, walletsData, message, users) {
    giveawaysData.finishGiveaway(message.id).then(finishedData => {
      (async () => {
        let validUsers = [];

        for (let i = 0; i < users.length; i++) {
          let hasWallet = await walletsData.userHasWallet(users[i].id);
          if (hasWallet) validUsers.push(users[i]);
        }

        if (validUsers.length > 0) {
          let payPart = ((finishedData.amount / config.metrics.coinUnits) / validUsers.length) - 0.001;

          for (let i = 0; i < users.length; i++) {
            await walletsData.sendPayment(finishedData.user_id, validUsers[i].id, payPart);
          }

          fs.readFile('./templates/giveaway_finished.msg', 'utf8', function (err, source) {
            if (err) throw err;

            let template = Handlebars.compile(source);
            let embedDescription = template(validUsers);
            let footerText = `${validUsers.length} winners paid.`;
            const gaEmbed = giveawaysData.createEmbedMessage(finishedData.description, embedDescription, footerText);
            message.edit({ embed: gaEmbed });
          });
        }
      })().catch(err => console.error(err));
    }).catch(err => console.error(err));
  }
}


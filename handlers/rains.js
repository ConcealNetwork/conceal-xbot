const fs = require('fs');
const config = require("../config.json");

let availableCommands = [
  "help",
  "recent",
  "alltime",
  "period",
  "reset"
];

module.exports = {
  executeCommand: async function (usersData, walletsData, client, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Uknows rain command. Type ".rain help" for available commands');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_rains.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if ((args[0] === "recent") || (args[0] === "alltime") || (args[0] === "period")) {
      let users = null;
      let count = 0;

      if (args.length < 2) {
        return message.reply('You need to specify an ammount to rain');
      }

      if (args.length < 3) {
        count = 10;
      } else {
        count = Math.min(parseInt(args[2].replace(/u/g, '')), 100);
      }

      // parse the amount and calculate the fee
      let amount = parseFloat(args[1].replace(/CCX/g, ''));

      if (!amount) {
        return message.reply('You need to specify a valid amount');
      }

      if (!count) {
        return message.reply('You need to specify valid number of users');
      }

      (async () => {
        let userHasWallet = await walletsData.userHasWallet(message.author.id);

        if (!userHasWallet) {
          return message.reply('You need to register a wallet first to use rain features');
        }

        switch (args[0]) {
          case 'recent':
            users = await usersData.getLastActiveUsers(count, [message.author.id]);
            break;
          case 'alltime':
            users = await usersData.getAllTimeActiveUsers(count, [message.author.id]);
            break;
          case 'period':
            users = await usersData.getActiveUsersByPeriod(count, [message.author.id]);
            break;
        }

        if (users.length > 0) {
          walletsData.getBalance(message.author.id).then(balanceData => {
            if (balanceData.balance > (amount * config.metrics.coinUnits)) {
              let payPart = (amount / users.length) - 0.001;

              users.forEach(function (user, index) {
                let discordUser = client.users.get(user.user_id) || client.fetchUser(user.user_id);

                if (discordUser) {
                  walletsData.sendPayment(message.author.id, user.user_id, payPart).then(data => {
                    message.channel.send(`\:money_with_wings: ${payPart} CCX rained on user <@${user.user_id}>`);
                  }).catch(err => {
                    message.channel.send(`\:x: Failed to rain on user <@${user.user_id}>`);
                  });
                }
              });
            } else {
              message.channel.send(`Insuficient balance!`);
            }
          }).catch(err => {
            message.channel.send(err);
          });
        }
      })().catch(err => {
        message.channel.send(`Failed to rain on users: ${err}`);
      });
    }

    if (args[0] === "reset") {
      if (!message.author.roles.some(r => ["Administrator"].includes(r.name)))
        return message.reply("Sorry, you don't have permissions to use this!");

      usersData.resetPeriodCounter().then(() => {
        message.channel.send('Period was succesffully reset.');
      }).catch(err => {
        message.channel.send(`Failed to reset period: ${err}`);
      });
    }
  }
};
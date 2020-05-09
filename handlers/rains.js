const fs = require('fs');
const config = require("../config.json");

module.exports = {
  executeCommand: async function (usersData, walletsData, client, message, command, args) {
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
        count = Math.min(parseInt(args[2]), 100);
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
        switch (args[0]) {
          case 'recent':
            users = await usersData.getLastActiveUsers(count);
            break;
          case 'alltime':
            users = await usersData.getAllTimeActiveUsers(count);
            break;
          case 'period':
            users = await usersData.getActiveUsersByPeriod(count);
            break;
        }

        // now get the target users and make sure that the caller is not among them
        let targetUsers = users.filter(user => user.user_id !== message.member.user.id);

        if (targetUsers.length > 0) {
          let payPart = (amount / targetUsers.length) - 0.001;

          targetUsers.forEach(function (user, index) {
            let discordUser = client.users.get(user.user_id) || client.fetchUser(user.user_id);

            if (discordUser) {
              walletsData.sendPayment(message.member.user.id, user.user_id, payPart).then(data => {
                message.channel.send(`\:money_with_wings: ${payPart} CCX rained on user <@${user.user_id}>`);
              }).catch(err => {
                message.channel.send(`\:x: Failed to rain on user <@${user.user_id}>`);
              });
            }
          });
        }
      })().catch(err => {
        message.channel.send(`Failed to rain on users: ${err}`);
      });
    }

    if (args[0] === "reset") {
      usersData.resetPeriodCounter().then(() => {
        message.channel.send('Period was succesffully reset.');
      }).catch(err => {
        message.channel.send(`Failed to reset period: ${err}`);
      });
    }
  }
};
const fs = require('fs');
const utils = require("../helpers/utils.js");
const config = require("../config.json");

let availableCommands = [
  "help",
  "recent",
  "alltime",
  "channel",
  "period",
  "random",
  "reset",
  "beer"
];

function getAllChannelUsers(client, count, channelId, authorId) {  
  return new Promise((resolve, reject) => {
    let pureChannelId = channelId.substring(
      channelId.indexOf("<") + 1, 
      channelId.lastIndexOf(">")
    );

    // get the channel object from the id of the requested channel
    let channel = client.channels.cache.get(pureChannelId.replace('#',''));
    let addCounter = 0;
    let allCounter = 0;
    let users = [];

    if (channel.members.size > 0) {
      channel.members.each(member => {
        if (authorId != member.user.id ) {
          let user = {
            user_id: member.user.id 
          };
    
          // add user to target list
          users.push(user);
          addCounter++;
        }

        // inc counter
        allCounter++;
  
        if ((addCounter >= count) || (allCounter >= channel.members.size)) {
          resolve(users);
        }
      });  
    } else {
      resolve(users);
    }
  });
}

module.exports = {
  executeCommand: async function (usersData, walletsData, settingsData, client, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Unknown rain command. Type ".rain help" for available commands');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_rains.msg', 'utf8', function (err, source) {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if ((args[0] === "recent") || (args[0] === "alltime") || (args[0] === "period") || (args[0] === "random") || (args[0] === "channel")) {
      let users = null;
      let amount = 0;
      let count = 0;

      if (args.length < 2) {
        return message.reply('You need to specify an ammount to rain');
      }

      // initialize vars
      let countIndex = 2;
      let defCount = 100;
      let argCount = 3;

      if (args[0] === "channel") {
        countIndex = 3;
        argCount = 4;
      }

      if (args.length < argCount) {
        count = 10;
      } else {        
        try {
          count = Math.min(parseInt(args[countIndex].replace(/u/g, '')), defCount);
          if (!count || count <= 0) throw "Number of users cannot be 0 or negative";
        } catch (err) {
          return message.reply(err);
        }
      }

      if ((args[0] === "channel") && (args.length < 3)) {
        return message.reply('You need to specify a valid channel');
      }

      try {
        amount = amount = parseFloat(args[1].replace(/CCX/g, ''));
        if (!amount || amount < config.restrictions.minRainAmount) throw `Amount cannot be less then ${config.restrictions.minRainAmount} CCX`;
      } catch (err) {
        return message.reply(err);
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
          case 'random':
            users = await usersData.getRandomUsers(count, [message.author.id]);
            break;
          case 'channel':
            users = await getAllChannelUsers(client, count, args[2], message.author.id);
            break;
        }

        if (users.length > 0) {
          walletsData.getBalance(message.author.id).then(balanceData => {
            if (balanceData.balance > (amount * config.metrics.coinUnits)) {
              let payPart = ((amount - 0.001) / users.length);

              (async () => {
                let payments = [];
                let userIds = [];

                for (let i = 0; i < users.length; i++) {
                  let guildMember = null;

                  try {
                    guildMember = await message.guild.members.fetch(users[i].user_id);
                  } catch(err) {
                    // unknow user
                    guildMember = null;
                  }

                  if (guildMember) {
                    payments.push({ userId: users[i].user_id, amount: payPart });

                    if (users[i].muted === 1) {
                      userIds.push(guildMember.user.username);
                    } else {
                      userIds.push(`<@${users[i].user_id}>`);
                    }
                  }
                }

                if (payments.length > 0) {
                  // send the payments to all the users at once and report
                  let txdata = await walletsData.sendPayments(message.author.id, payments);
                  message.author.send(`Success! ***TX hash***: ${txdata.transactionHash}\n***Secret key***: ${txdata.transactionSecretKey}`);
                  let chunks = Math.floor(userIds.length / 30);
                  var remainder = userIds.length % 30;

                  if (remainder > 0) {
                    chunks++;
                  }

                  // send in chunks to avoid limits
                  for (let i = 0; i < chunks; i++) {
                    let chunkUsers = userIds.slice(i * 30, (i * 30) + 30);
                    message.channel.send(`\:money_with_wings: ${payPart.toFixed(6)} CCX rained on users ${chunkUsers.join()}`);
                  }
                } else {
                  message.channel.send(`No users were found that would fit the criteria`);
                }
              })().catch(err => {
                message.channel.send(`Error while raining on users: ${err}`);
                console.error(`Error while raining on users: ${err}`);
              });
            } else {
              message.channel.send(`Insufficient balance!`);
            }
          }).catch(err => {
            message.channel.send(err);
            console.error(err);
          });
        }
      })().catch(err => {
        message.channel.send(`Failed to rain on users: ${err}`);
        console.error(`Failed to rain on users: ${err}`);
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

    if (args[0] === "beer") {
      message.channel.send(`\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\n\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:\:beer:`);
    }
  }
};
const fs = require('fs');
const moment = require('moment');
const utils = require("../helpers/utils.js");
const Handlebars = require("handlebars");
const config = require("../config.json");

let availableCommands = [
  "help",
  "create",
  "list",
  "delete"
];

module.exports = {
  executeCommand: async function (giveawaysData, walletsData, client, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Unknown giveaway command. Type ".giveaway help" for available commands');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_giveaways.msg', 'utf8', function (err, source) {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if (args[0] === "create") {
      let timespan = null;
      let winners = null;
      let amount = null;
      let title = null;

      if (!args[1]) {
        return message.channel.send('Please specify a timespan.');
      } else {
        if (args[1].search("s") > 0) timespan = parseInt(args[1]);
        else if (args[1].search("m") > 0) timespan = parseInt(args[1]) * 60;
        else if (args[1].search("h") > 0) timespan = parseInt(args[1]) * 3600;
        else if (args[1].search("d") > 0) timespan = parseInt(args[1]) * 86400;
        else timespan = parseInt(args[1]);

        if (!timespan) {
          return message.reply('You need to specify a valid timespan!');
        }
      }

      if (!args[2]) {
        return message.channel.send('Please specify a number of winners.');
      } else {
        try {
          winners = parseInt(args[2].replace(/w/g, ''));
          if (!winners || winners <= 0) throw "Winners cannot be 0 or negative!";
        } catch (err) {
          return message.reply(err);
        }
      }

      if (!args[3]) {
        return message.channel.send('Please specify reward amount.');
      } else {
        try {
          amount = parseFloat(args[3].replace(/CCX/g, ''));
          if (!amount || amount < config.restrictions.minGiveawayAmount) throw `Amount cannot be less then ${config.restrictions.minGiveawayAmount} CCX`;
        } catch (err) {
          return message.reply(err);
        }
      }

      if (!args[4]) {
        return message.channel.send('Please specify giveaway title.');
      } else {
        title = args.slice(4).join(" ");
      }

      walletsData.userHasWallet(message.author.id).then(hasWallet => {
        if (hasWallet) {
          walletsData.getBalance(message.author.id).then(balanceData => {
            if (balanceData.balance > (amount * config.metrics.coinUnits)) {
              const description = `React with \:tada: to enter. Prize is ${amount} CCX. \n Ends at ${moment.utc().add(timespan, 'seconds').format('LLLL')} UTC`;
              const footer = `${winners} winners | Created at:`;
              const giveawayEmbed = giveawaysData.createEmbedMessage(title, description, footer);
              let isSameChannel = false;
              let channel = null;

              if (config.giveaways && config.giveaways.channel) {
                channel = message.guild.channels.get(config.giveaways.channel);
              } else {
                channel = message.channel;
              }

              // check if we are posting to same channel we are in
              isSameChannel = channel.id == message.channel.id;

              if (isSameChannel) {
                message.delete().catch(O_o => { });
              }

              channel.send({ embed: giveawayEmbed }).then(newMsg => {
                giveawaysData.createGiveaway(message.author.id, newMsg.channel.id, newMsg.id, timespan, winners, amount, title).then(data => {
                  newMsg.react('🎉');

                  if (!isSameChannel) {
                    message.channel.send(`The giveaway was created in <#${config.giveaways.channel}>`);
                  }
                }).catch(err => {
                  newMsg.delete().catch(O_o => { });
                  message.channel.send(`Error creating giveaway: ${err}`);
                });
              }).catch(err => {
                console.error('Failed sending giveaway message to channel', err);
              });
            } else {
              message.channel.send(`Insufficient balance!`);
            }
          }).catch(err => {
            message.channel.send(err);
          });
        } else {
          return message.reply('You need to register a wallet first to use giveaway features');
        }
      }).catch(err => {
        message.channel.send(`Failed to check for users wallet: ${err}`);
      });
    }

    if (args[0] === "list") {
      giveawaysData.listGiveaways().then(data => {
        fs.readFile('./templates/giveaway_list.msg', 'utf8', function (err, source) {
          if (err) throw err;

          let template = Handlebars.compile(source);
          message.channel.send(template(data));
        });

      }).catch(err => {
        message.channel.send('Failed to list giveaways');
      });
    }

    if (args[0] === "delete") {
      if (!args[1]) {
        return message.channel.send('Please specify the giveaway id!');
      } else {
        let giveawayId = parseInt(args[1]);

        giveawaysData.getGiveawayByRowId(giveawayId).then(giveawayData => {
          if (giveawayData.user_id !== message.author.id) {
            message.channel.send('You cannot delete giveaways from other users.');
          } else {
            giveawaysData.finishGiveaway(giveawayId).then(finishedData => {
              message.channel.send('Giveaway was succesfully deleted.');
            }).catch(err => {
              console.error('Failed to finish giveaway', err);
            });
          }
        }).catch(err => {
          message.channel.send(`Error deleting giveaway: ${err}`);
        });
      }
    }
  },
  finishGiveaway: function (giveawaysData, walletsData, message, users) {
    let getRandom = (arr, n) => {
      var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
      if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
      while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
      }
      return result;
    }

    giveawaysData.finishGiveaway(message.id).then(finishedData => {
      (async () => {
        let validUsers = [];
        let channel = null;

        if (config.giveaways && config.giveaways.channel) {
          channel = message.guild.channels.get(config.giveaways.channel);
        } else {
          channel = message.channel;
        }

        for (let i = 0; i < users.length; i++) {
          let hasWallet = await walletsData.userHasWallet(users[i].id);
          if (hasWallet) validUsers.push(users[i]);
        }

        if (validUsers.length > 0) {
          let winners = getRandom(validUsers, Math.min(validUsers.length, finishedData.winners));
          let payPart = (((finishedData.amount / config.metrics.coinUnits) - 0.001) / winners.length);
          let payments = [];

          for (let i = 0; i < winners.length; i++) {
            payments.push({ userId: winners[i].id, amount: payPart });
          }

          // send payment to all the winners, then send a response
          await walletsData.sendPayments(finishedData.user_id, payments);

          fs.readFile('./templates/giveaway_finished.msg', 'utf8', function (err, source) {
            if (err) throw err;

            let template = Handlebars.compile(source);
            let embedDescription = template(payments);
            let footerText = `${winners.length} winners paid. | Finished at:`;
            const gaEmbed = giveawaysData.createEmbedMessage(finishedData.description, embedDescription, footerText);
            message.delete().catch(O_o => { });
            channel.send({ embed: gaEmbed });
          });
        } else {
          let embedDescription = 'There were no valid winners for the giveaway.';
          let footerText = `0 winners paid. | Finished at:`;
          const gaEmbed = giveawaysData.createEmbedMessage(finishedData.description, embedDescription, footerText);
          message.delete().catch(O_o => { });
          channel.send({ embed: gaEmbed });
        }
      })().catch(err => console.error('giveawaysData.finishGiveaway async error', err));
    }).catch(err => console.error('giveawaysData.finishGiveaway error', err));
  }
}


const fs = require('fs');
const config = require("../config.json");
const Handlebars = require("handlebars");

module.exports = {
  executeCommand: function (tipBotStorage, message, command, args) {
    if (args[0] == "register") {
      if (args.length < 2) {
        message.reply('Please type your wallet address. Use "help" command for help')
      } else {
        tipBotStorage.registerWallet(message.member.user.id, message.member.user.username, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to register wallet: ${err}`);
        }).finally(message.reply('The registration information has been sent to you in DM'));
      }
    }

    if (args[0] == "update") {
      if (args.length < 2) {
        message.reply('Please type your wallet address. Use "help" command for help')
      } else {
        tipBotStorage.updateWallet(message.member.user.id, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to update wallet: ${err}`);
        }).finally(message.reply('The update information has been sent to you in DM'));
      }
    }

    if (args[0] == "show") {
      tipBotStorage.showWalletInfo(message.member.user.id).then(data => {
        message.author.send(`***Address***: ${data.address}, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        message.author.send(`Error trying to get wallet info: ${err}`);
      }).finally(message.reply('The wallet information has been sent to you in DM'));
    }

    if (args[0] == "deposit") {
      tipBotStorage.showWalletInfo(message.member.user.id).then(data => {
        message.author.send(`Please deposit your CCX to ***Address***: ${config.wallet.address}, ***Payment Id***: ${data.payment_id}. Its mandatory to include payment Id or your funds will be lost!`);
      }).catch(err => {
        message.author.send(err);
      }).finally(message.reply('The deposit information has been sent to you in DM'));
    }

    if (args[0] == "balance") {
      tipBotStorage.getBalance(message.member.user.id).then(data => {
        message.author.send(`***Balance***: ${(data.balance / config.metrics.coinUnits).toLocaleString()} CCX, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        message.author.send(`Error trying to get balance: ${err}`);
      }).finally(message.reply('The balance information has been sent to you in DM'));
    }

    if (command === "paymentid") {
      tipBotStorage.generatePaymentId().then(payment_id => {
        message.channel.send(payment_id);
      });
    }
  }
};
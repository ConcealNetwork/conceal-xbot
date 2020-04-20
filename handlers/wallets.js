const fs = require('fs');
const config = require("../config.json");
const Handlebars = require("handlebars");

module.exports = {
  executeCommand: function (tipBotStorage, message, command, args) {
    if (args[0] == "register") {
      tipBotStorage.registerWallet(message.member.user.id, message.member.user.username, args[1]).then(data => {
        return message.reply(data.reason);
      }).catch(err => {
        return message.reply(`Error trying to register wallet: ${err}`);
      });
    }

    if (args[0] == "show") {
      tipBotStorage.showWalletInfo(message.member.user.id).then(data => {
        return message.reply(`***Address***: ${data.address}, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        return message.reply(`Error trying to get wallet info: ${err}`);
      });
    }

    if (args[0] == "deposit") {
      tipBotStorage.showWalletInfo(message.member.user.id).then(data => {
        return message.reply(`Please deposit your CCX to ***Address***: ${config.wallet.address}, ***Payment Id***: ${data.payment_id}. Its mandatory to include payment Id or your funds will be lost!`);
      }).catch(err => {
        return message.reply(err);
      });
    }

    if (args[0] == "balance") {
      tipBotStorage.getBalance(message.member.user.id).then(data => {
        return message.reply(`***Balance***: ${data.balance}, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        return message.reply(`Error trying to get balance: ${err}`);
      });
    }

    if (command === "paymentid") {
      tipBotStorage.generatePaymentId().then(payment_id => {
        message.channel.send(payment_id);
      });
    }
  }
};
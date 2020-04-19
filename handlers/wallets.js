const fs = require('fs');
const Handlebars = require("handlebars");

module.exports = {
  executeCommand: function (tipBotStorage, message, command, args) {
    if (args[0] == "register") {
      tipBotStorage.registerWallet(message.member.user.id, message.member.user.username, args[1], function (data) {
        return message.reply(data.reason);
      });
    }

    if (args[0] == "show") {
      tipBotStorage.showWalletInfo(message.member.user.id, function (data) {
        if (data.success) {
          return message.reply(`***Address***: ${data.address}, ***Payment Id***: ${data.payment_id}`);
        } else {
          return message.reply('Could not find any info about your wallet. Did you register one yet?');
        }

      });
    }

    if (args[0] == "deposit") {
      tipBotStorage.showWalletInfo(message.member.user.id, function (data) {
        if (data.success) {
          return message.reply(`Please deposit your CCX to ***Address***: ${config.wallet.address}, ***Payment Id***: ${data.payment_id}. Its mandatory to include payment Id or your funds will be lost!`);
        } else {
          return message.reply('Could not find any info about your wallet. Did you register one yet?');
        }
      });
    }

    if (args[0] == "balance") {
      tipBotStorage.getBalance(message.member.user.id, function (data) {
      });
    }

    if (command === "paymentid") {
      tipBotStorage.generatePaymentId(function (data) {
        message.channel.send(data);
      });
    }

    if (args[0] == "tip") {
      console.log(args[1], args[2]);
      tipBotStorage.sendPayment("ccx7ZuCP9NA2KmnxbyBn9QgeLSATHXHRAXVpxgiaNxsH4GwMvQ92SeYhEeF2tJHADHbW4bZMFHvFf8GpucLrRyw49q4Gkc3AXM", 1, "a09fc9e4797450bdeac8cfdd1080216799c49eab89aae7d5cdb4935e441e185a", function (data) {
      });
    }

  }
};
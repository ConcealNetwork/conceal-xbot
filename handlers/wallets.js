const fs = require('fs');
const config = require("../config.json");
const Handlebars = require("handlebars");

module.exports = {
  executeCommand: function (walletsData, message, command, args) {
    function sendCommonError(errMsg) {
      message.author.send(errMsg);
      message.author.send('If you do not have the wallet registered yet please register it. For list of wallet commands type ```.wallet help```');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_wallets.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if (args[0] == "register") {
      if (args.length < 2) {
        message.reply('Please type your wallet address. Use ".wallet help" command for help')
      } else {
        walletsData.registerWallet(message.member.user.id, message.member.user.username, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to register wallet: ${err}`);
        }).finally(message.reply('The registration information has been sent to you in DM'));
      }
    }

    if (args[0] == "update") {
      if (args.length < 2) {
        message.reply('Please type your wallet address. Use ".wallet help" command for help')
      } else {
        walletsData.updateWallet(message.member.user.id, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to update wallet: ${err}`);
        }).finally(message.reply('The update information has been sent to you in DM'));
      }
    }

    if (args[0] == "show") {
      walletsData.showWalletInfo(message.member.user.id).then(data => {
        message.author.send(`***Address***: ${data.address}, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        sendCommonError(`Error trying to get wallet info: ${err}`);
      }).finally(message.reply('The wallet information has been sent to you in DM'));
    }

    if (args[0] == "deposit") {
      walletsData.showWalletInfo(message.member.user.id).then(data => {
        message.author.send(`Please deposit your CCX to ***Address***: ${config.wallet.address}, ***Payment Id***: ${data.payment_id}. Its mandatory to include payment Id or your funds will be lost!`);
      }).catch(err => {
        sendCommonError(`Error trying to get deposit info: ${err}`);
      }).finally(message.reply('The deposit information has been sent to you in DM'));
    }

    if (args[0] == "withdraw") {
      if (args.length < 2) {
        message.reply('Please type the amount you want to withdraw')
      } else {
        let amount = parseFloat(args[1].replace(/CCX/g, ''));

        if (!amount) {
          return message.reply('You need to specify a valid amount!');
        }

        walletsData.sendPayment(message.member.user.id, message.member.user.id, amount).then(data => {
          message.author.send(`Success! ***TX hash***: ${data.transactionHash}, ***Secret key***: ${data.transactionSecretKey}`);
        }).catch(err => {
          message.author.send(`Error trying to withdraw funds: ${err}`);
        }).finally(message.reply('The withdraw information has been sent to you in DM'));
      }
    }

    if (args[0] == "balance") {
      walletsData.getBalance(message.member.user.id).then(data => {
        message.author.send(`***Balance***: ${(data.balance / config.metrics.coinUnits).toLocaleString()} CCX, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        sendCommonError(`Error trying to get balance: ${err}`);
      }).finally(message.reply('The balance information has been sent to you in DM'));
    }

    if (command === "paymentid") {
      walletsData.generatePaymentId().then(payment_id => {
        message.channel.send(payment_id);
      });
    }
  }
};
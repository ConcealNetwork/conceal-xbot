const fs = require('fs');
const config = require("../config.json");
const Handlebars = require("handlebars");

let availableCommands = [
  "help",
  "register",
  "update",
  "show",
  "deposit",
  "withdraw",
  "balance",
  "paymentid"
];

module.exports = {
  executeCommand: function (walletsData, message, command, args) {
    function sendCommonError(errMsg) {
      message.author.send(errMsg);
      message.author.send('If you do not have the wallet registered yet please register it. For list of wallet commands type ```.wallet help```');
    }

    function sendNotification(content) {
      if (message.channel.type !== "dm") {
        message.reply(content)
      }
    }

    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Uknows wallet command. Type ".wallet help" for available commands');
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
        walletsData.registerWallet(message.author.id, message.author.username, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to register wallet: ${err}`);
        }).finally(() => { sendNotification('The registration information has been sent to you in DM') });
      }
    }

    if (args[0] == "update") {
      if (args.length < 2) {
        message.reply('Please type your wallet address. Use ".wallet help" command for help')
      } else {
        walletsData.updateWallet(message.author.id, args[1]).then(response => {
          message.author.send(response);
        }).catch(err => {
          message.author.send(`Error trying to update wallet: ${err}`);
        }).finally(() => { sendNotification('The update information has been sent to you in DM') });
      }
    }

    if (args[0] == "show") {
      walletsData.showWalletInfo(message.author.id).then(data => {
        message.author.send(`***Address***: ${data.address}, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        sendCommonError(`Error trying to get wallet info: ${err}`);
      }).finally(() => { sendNotification('The wallet information has been sent to you in DM') });
    }

    if (args[0] == "deposit") {
      walletsData.showWalletInfo(message.author.id).then(data => {
        message.author.send(`Please deposit your CCX to ***Address***: ${config.wallet.address}, ***Payment Id***: ${data.payment_id}. Its mandatory to include payment Id or your funds will be lost!`);
      }).catch(err => {
        sendCommonError(`Error trying to get deposit info: ${err}`);
      }).finally(() => { sendNotification('The deposit information has been sent to you in DM') });
    }

    if (args[0] == "withdraw") {
      let amount = 0;

      if (args.length < 2) {
        message.reply('Please type the amount you want to withdraw')
      } else {
        if (args[1] !== "all") {
          amount = parseFloat(args[1].replace(/CCX/g, '')) * config.metrics.coinUnits;

          if (!amount) {
            return message.reply('You need to specify a valid amount!');
          }
        }

        walletsData.getBalance(message.author.id).then(data => {
          if (amount == 0) {
            amount = data.balance - (0.0011 * config.metrics.coinUnits);
          }

          // use slightly more for the fee to avoid rounding errors
          if ((amount + (0.0011 * config.metrics.coinUnits)) <= data.balance) {
            walletsData.sendPayment(message.author.id, message.author.id, amount / config.metrics.coinUnits).then(data => {
              message.author.send(`Success! ***TX hash***: ${data.transactionHash}, ***Secret key***: ${data.transactionSecretKey}`);
            }).catch(err => {
              sendCommonError(`Error trying to withdraw funds: ${err}`);
            }).finally(() => { sendNotification('The withdraw information has been sent to you in DM') });
          } else {
            message.author.send('Your balance is to low to send the selected amount');
            sendNotification('The withdraw information has been sent to you in DM');
          }
        }).catch(err => {
          sendCommonError(`Error trying to withdraw funds: ${err}`);
          sendNotification('The withdraw information has been sent to you in DM');
        });
      }
    }

    if (args[0] == "balance") {
      walletsData.getBalance(message.author.id).then(data => {
        message.author.send(`***Balance***: ${(data.balance / config.metrics.coinUnits).toLocaleString()} CCX, ***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        sendCommonError(`Error trying to get balance: ${err}`);
      }).finally(() => { sendNotification('The balance information has been sent to you in DM') });
    }

    if (args[0] === "paymentid") {
      walletsData.showWalletInfo(message.author.id).then(data => {
        message.author.send(`***Payment Id***: ${data.payment_id}`);
      }).catch(err => {
        sendCommonError(`Error trying to get wallet info: ${err}`);
      }).finally(() => { sendNotification('The paymentid information has been sent to you in DM') });
    }
  }
};
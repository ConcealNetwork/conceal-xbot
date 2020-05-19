const fs = require('fs');
const Handlebars = require("handlebars");
const pools = require("../modules/pools.js");
const utils = require("../helpers/utils.js");

let availableCommands = [
  "help",
  "info",
  "list"
];

module.exports = {
  executeCommand: function (message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Uknows pools command. Type ".pools help" for available commands');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_pools.msg', 'utf8', function (err, source) {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if (args[0] == "info") {
      // get the basic markets info
      pools.getPoolsInfo().then(data => {
        fs.readFile('./templates/pools_info.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          // send resply back to the channel
          message.channel.send(template(data));
        });
      }).catch(err => {
        message.channel.send(`Failed to get pools info: ${err}`);
      });
    }

    if (args[0] == "list") {
      // get the basic markets info
      pools.getPoolsList().then(data => {
        fs.readFile('./templates/pools_list.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          // send resply back to the channel
          message.channel.send(template(data));
        });
      }).catch(err => {
        message.channel.send(`Failed to get pools list: ${err}`);
      });
    }
  }
};
const fs = require('fs');
const utils = require("../helpers/utils.js");
const config = require("../config.json");

let availableCommands = [
  "mute"
];

module.exports = {
  executeCommand: async function (settingsData, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Unknown settings command. Type ".settings help" for available commands');
    }

    if (args[0] === "help") {

      fs.readFile('./templates/help_settings.msg', 'utf8', function (err, source) {
        if (err) throw err;
        utils.sendHelpContent(message, source);
      });
    }

    if (args[0] === "mute") {
      if (!args[1]) {
        message.channel.send('Please specify a second argument. Valid arguments are "on" or "off"');
      } else {
        if (args[1] === "on") {
          settingsData.setMutedState(message.author.id, true).then(() => {
            message.channel.send('Mute has been enabled on your wallet');
          }).catch(err => {
            message.channel.send(`Error trying to enable mute: ${err}`);
          });
        } else if (args[1] === "off") {
          settingsData.setMutedState(message.author.id, false).then(() => {
            message.channel.send('Mute has been dissabled on your wallet');
          }).catch(err => {
            message.channel.send(`Error trying to dissable mute: ${err}`);
          });
        } else {
          message.channel.send('Wrong second argument. Valid arguments are "on" or "off"');
        }
      }
    }
  }
};
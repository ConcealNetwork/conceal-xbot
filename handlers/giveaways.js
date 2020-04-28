const fs = require('fs');
const config = require("../config.json");

module.exports = {
  executeCommand: async function (giveawaysData, client, message, command, args) {
    if (args[0] === "help") {

      fs.readFile('./templates/help_giveaways.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if (args[0] === "create") {
      giveawaysData.createGiveaway(message.member.user.id, message.id, args[1], parseInt(args[2]), parseInt(args[3]), parseInt(args[4])).then(data => {
        console.log(data);
      }).catch(err => {
        console.error('Error creating giveaway', err);
      });
    }
  }
}


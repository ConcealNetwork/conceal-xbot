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
      let timespan = parseInt(args[1]);
      let winners = parseInt(args[2]);
      let amount = parseFloat(args[3]);
      let description = args[4];

      const giveawayEmbed = {
        color: 0x0099ff,
        title: description,
        url: 'https://discord.js.org',
        author: {
          name: 'Conceal Network',
          icon_url: 'https://conceal.network/images/branding/logo.png',
          url: 'https://discord.gg/YbpHVSd'
        },
        description: `React with \:tada: to enter. Prize is ${amount} CCX`,
        timestamp: new Date(),
        footer: {
          text: `${winners} winners | ends at ...`,
          icon_url: 'https://conceal.network/images/branding/logo.png'
        }
      };

      // delete the command
      //message.delete();

      message.channel.send({ embed: giveawayEmbed }).then(newMsg => {
        giveawaysData.createGiveaway(message.member.user.id, newMsg.id, timespan, winners, amount, description).then(data => {
          newMsg.react('🎉');
        }).catch(err => {
          newMsg.delete();
          message.channel.send(`Error creating giveaway: ${err}`);
        });
      });
    }
  }
}


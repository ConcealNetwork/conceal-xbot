const fs = require('fs');
const config = require("../config.json");

let availableCommands = [
  "help",
  "all",
  "online",
  "offline",
  "kick",
  "ban"
];

module.exports = {
  executeCommand: async function (client, message, command, args) {
    if (availableCommands.indexOf(args[0]) == -1) {
      // no valid command was found notify the user about it
      return message.channel.send('Uknows users command. Type ".users help" for available commands');
    }

    if (message.channel.type == "dm") {
      return message.channel.send("Users related command are not available in DM");
    }

    if (args[0] === "help") {
      fs.readFile('./templates/help_users.msg', 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });
    }

    if (args[0] === "all") {
      message.guild.fetchMembers().then(data => {
        let count = data.members.filter(member => !member.user.bot).size;
        return message.reply(`There is currently ${count} users registered on the server.`);
      }).catch(err => {
        return message.channel.send(`Error trying to get user count: ${err}`);
      });
    }

    if (args[0] === "online") {
      message.guild.fetchMembers().then(data => {
        let count = data.members.filter(member => !member.user.bot && (member.presence.status === "online")).size;
        return message.reply(`There is currently ${count} users online on the server.`);
      }).catch(err => {
        return message.channel.send(`Error trying to get user count: ${err}`);
      });
    }

    if (args[0] === "offline") {
      message.guild.fetchMembers().then(data => {
        let count = data.members.filter(member => !member.user.bot && (member.presence.status !== "online")).size;
        return message.reply(`There is currently ${count} users offline on the server.`);
      }).catch(err => {
        return message.channel.send(`Error trying to get user count: ${err}`);
      });
    }

    if (args[0] === "kick") {
      // This command must be limited to mods and admins. In this example we just hardcode the role names.
      // Please read on Array.some() to understand this bit: 
      // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
      if (!message.member.roles.some(r => ["admins", "mods"].includes(r.name)))
        return message.reply("Sorry, you don't have permissions to use this!");

      // Let's first check if we have a member and if we can kick them!
      // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
      // We can also support getting the member by ID, which would be args[0]
      let member = message.mentions.members.first() || message.guild.members.get(args[1]);
      if (!member)
        return message.reply("Please mention a valid member of this server");
      if (!member.kickable)
        return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

      // slice(1) removes the first part, which here should be the user mention or ID
      // join(' ') takes all the various parts to make it a single string.
      let reason = args.slice(2).join(' ');
      if (!reason) reason = "No reason provided";

      // Now, time for a swift kick in the nuts!
      await member.kick(reason).catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
      return message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
    }

    if (args[0] === "ban") {
      // Most of this command is identical to kick, except that here we'll only let admins do it.
      // In the real world mods could ban too, but this is just an example, right? ;)
      if (!message.member.roles.some(r => ["admins"].includes(r.name)))
        return message.reply("Sorry, you don't have permissions to use this!");

      let member = message.mentions.members.first();
      if (!member)
        return message.reply("Please mention a valid member of this server");
      if (!member.bannable)
        return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

      let reason = args.slice(2).join(' ');
      if (!reason) reason = "No reason provided";

      await member.ban(reason).catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
      return message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
    }
  }
};
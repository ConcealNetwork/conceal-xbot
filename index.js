const fs = require('fs');
const Numeral = require('numeral');
const Discord = require("discord.js");
const Handlebars = require("handlebars");
const pools = require("./handlers/pools.js");
const markets = require("./handlers/markets.js");
const marketsData = require("./modules/markets.js");
const wallets = require("./handlers/wallets.js");
const exchanges = require("./handlers/exchanges.js");
const blockchain = require("./handlers/blockchain.js");
const BlockchainInfo = require("./modules/blockchain.js");
const TipBotStorage = require("./modules/wallets.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();
const tipBotStorage = new TipBotStorage();
const blockchainInfo = new BlockchainInfo();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('guildMemberAdd', member => {
  marketsData.getExchanges().then(data => {
    fs.readFile('./templates/welcome.msg', 'utf8', function (err, source) {
      if (err) throw err;

      var template = Handlebars.compile(source);
      member.send(template(data));
    });
  });
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if (message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === "exchanges") {
    if (args.length == 0) {
      return message.reply(`You need to specify a exchanges command! Type: ***${config.prefix}exchanges help*** for list of commands`);
    }

    // execute the exchanges commands
    exchanges.executeCommand(message, command, args);
  }

  if (command === "markets") {
    if (args.length == 0) {
      return message.reply(`You need to specify a markets command! Type: ***${config.prefix}markets help*** for list of commands`);
    }

    // execute the markets commands
    return markets.executeCommand(message, command, args);
  }

  if (command === "blockchain") {
    if (args.length == 0) {
      return message.reply(`You need to specify a blockchain command! Type: ***${config.prefix}blockchain help*** for list of commands`);
    }

    // execute the blockchain commands
    return blockchain.executeCommand(blockchainInfo, message, command, args);
  }

  if (command === "wallet") {
    if (args.length == 0) {
      return message.reply(`You need to specify a wallet command! Type: ***${config.prefix}wallet help*** for list of commands`);
    }

    // execute the blockchain commands
    return wallets.executeCommand(tipBotStorage, message, command, args);
  }

  if (command === "pools") {
    if (args.length == 0) {
      return message.reply(`You need to specify a pool command! Type: ***${config.prefix}pools help*** for list of commands`);
    }

    // execute the blockchain commands
    return pools.executeCommand(message, command, args);
  }

  if (command === "tip") {
    if (args.length < 2) {
      return message.reply('You need to specify an ammount and a recipient. Use ".wallet help" command for help');
    }

    if (!message.mentions.users.first()) {
      return message.reply('You need to specify at least one recipient. Use ".wallet help" command for help');
    }

    // execute the blockchain commands
    return tipBotStorage.sendPayment(message.member.user.id, message.mentions.users.first().id, parseFloat(args[0])).then(data => {
      message.author.send(`Success! ***TX hash***: ${data.transactionHash}, ***Secret key***: ${data.transactionSecretKey}`);
      console.log(data);
    }).catch(err => {
      message.author.send(err);
    }).finally(message.reply('The tip details were send to you in DM'));
  }

  if (command === "help") {
    for (let i = 1; i < 8; i++) {
      source = fs.readFileSync(`./templates/help_general_${i}.msg`, { encoding: 'utf8', flag: 'r' });
      var template = Handlebars.compile(source);
      message.channel.send(template(template));
      return true;
    }
  }

  if (command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o => { });
    // And we get the bot to say the thing: 
    return message.channel.send(sayMessage);
  }

  if (command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if (!message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");

    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.kickable)
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    // Now, time for a swift kick in the nuts!
    await member.kick(reason).catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    return message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
  }

  if (command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if (!message.member.roles.some(r => ["Administrator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");

    let member = message.mentions.members.first();
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.bannable)
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";

    await member.ban(reason).catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    return message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }

  if (command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    if (!message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");

    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);

    // Ooooh nice, combined conditions. <3
    if (!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({ limit: deleteCount });
    return message.channel.bulkDelete(fetched).catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }

  // if we came this far then no command was found
  return message.reply('Unknow command. Please type ".help" for more info on how to use the bot');
});

client.login(config.token);
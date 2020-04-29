const fs = require('fs');
const path = require('path');
const Numeral = require('numeral');
const sqlite3 = require('sqlite3');
const Discord = require("discord.js");
const appRoot = require('app-root-path');
const Handlebars = require("handlebars");
const pools = require("./handlers/pools.js");
const users = require("./handlers/users.js");
const UsersData = require("./modules/users.js");
const markets = require("./handlers/markets.js");
const marketsData = require("./modules/markets.js");
const wallets = require("./handlers/wallets.js");
const exchanges = require("./handlers/exchanges.js");
const giveaways = require("./handlers/giveaways.js");
const blockchain = require("./handlers/blockchain.js");
const WalletsData = require("./modules/wallets.js");
const GiveawaysData = require("./modules/giveaways.js");
const BlockchainData = require("./modules/blockchain.js");

// open the access to the database if it fails we must stop
this.db = new sqlite3.Database(path.join(appRoot.path, "tipbot.db"), sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  }
});

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();
const usersData = new UsersData(this.db);
const walletsData = new WalletsData(this.db);
const giveawaysData = new GiveawaysData(this.db);
const blockchainData = new BlockchainData();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");

// handle all unhandler exceptions
process.on('uncaughtException', err => {
  console.error('There was an uncaught error', err)
  process.exit(1);
});

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

client.on('messageReactionAdd', (reaction, user) => {
  console.log(user);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  if (message.member && message.member.user) {
    // update the activity for the current user
    usersData.updateUserActivity(message.member.user.id).catch(err => {
      console.error('Error trying to log user activity', err);
    });
  }

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
    return exchanges.executeCommand(message, command, args);
  }

  if (command === "markets") {
    if (args.length == 0) {
      return message.reply(`You need to specify a markets command! Type: ***${config.prefix}markets help*** for list of commands`);
    }

    // execute the markets commands
    return markets.executeCommand(message, command, args);
  }

  if (command === "blockchain" || command === "chain") {
    if (args.length == 0) {
      return message.reply(`You need to specify a blockchain command! Type: ***${config.prefix}blockchain help*** for list of commands`);
    }

    // execute the blockchain commands
    return blockchain.executeCommand(blockchainData, message, command, args);
  }

  if (command === "wallet") {
    if (args.length == 0) {
      return message.reply(`You need to specify a wallet command! Type: ***${config.prefix}wallet help*** for list of commands`);
    }

    // execute the blockchain commands
    return wallets.executeCommand(walletsData, message, command, args);
  }

  if (command === "pools") {
    if (args.length == 0) {
      return message.reply(`You need to specify a pool command! Type: ***${config.prefix}pools help*** for list of commands`);
    }

    // execute the blockchain commands
    return pools.executeCommand(message, command, args);
  }

  if (command === "giveaway") {
    if (args.length == 0) {
      return message.reply(`You need to specify a giveaway command! Type: ***${config.prefix}giveaway help*** for list of commands`);
    }

    // execute the blockchain commands
    return giveaways.executeCommand(giveawaysData, client, message, command, args);
  }

  if (command === "users") {
    if (args.length == 0) {
      return message.reply(`You need to specify a users command! Type: ***${config.prefix}users help*** for list of commands`);
    }

    // execute the blockchain commands
    return users.executeCommand(client, message, command, args);
  }

  /************************************************************
   *  Tip command. Take ammount specified and tip the target  *
   *  user. User needs to have a registered wallet otherwise  *
   *  it fails. Also checks the balance first.                *
   ***********************************************************/
  if (command === "tip") {
    if (args.length < 2) {
      return message.reply('You need to specify an ammount and a recipient.');
    }

    if (!message.mentions.users.first()) {
      return message.reply('You need to specify at least one recipient.');
    }

    // execute the blockchain commands
    return WalletsData.sendPayment(message.member.user.id, message.mentions.users.first().id, parseFloat(args[0])).then(data => {
      message.author.send(`Success! ***TX hash***: ${data.transactionHash}, ***Secret key***: ${data.transactionSecretKey}`);
    }).catch(err => {
      message.author.send(err);
    }).finally(message.reply('The tip details were send to you in DM'));
  }

  /************************************************************
   *  Rain command. Take ammount specified and number of user *
   *  It then takes latest active users and proportionally    *
   *  rains the CCX specified over all of them                *
   ***********************************************************/
  if (command === "rain") {
    let count = 0;

    if (args.length < 1) {
      return message.reply('You need to specify an ammount to rain');
    }

    if (args.length < 2) {
      count = 10;
    } else {
      count = Math.min(parseInt(args[1]), 100);
    }

    // parse the amount and calculate the fee
    let amount = parseFloat(args[0]);

    return usersData.getLastActiveUsers(count).then(users => {
      let targetUsers = users.filter(user => user.user_id !== message.member.user.id);

      if (targetUsers.length > 0) {
        let payPart = (amount / targetUsers.length) - 0.001;

        targetUsers.forEach(function (user, index) {
          let discordUser = client.users.get(user.user_id) || client.fetchUser(user.user_id);

          if (discordUser) {
            walletsData.sendPayment(message.member.user.id, user.user_id, payPart).then(data => {
              message.channel.send(`\:money_with_wings: ${payPart} CCX rained on user <@${user.user_id}>`);
            }).catch(err => {
              message.channel.send(`\:x: Failed to rain on user <@${user.user_id}>`);
            });
          }
        });
      }
    }).catch(err => {
      message.reply(err);
    });
  }

  if (command === "help") {
    function sendNextHelpPart(partNum) {
      fs.readFile(`./templates/help_general_${partNum}.msg`, 'utf8', function (err, source) {
        if (err) throw err;
        message.channel.send(source);
      });

      if (partNum < 2) {
        setTimeout(() => {
          sendNextHelpPart(partNum + 1)
        }, 200);
      }
    }

    // send first part and return 
    sendNextHelpPart(1);
    return true;
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
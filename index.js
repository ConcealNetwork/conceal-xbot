const fs = require('fs');
const path = require('path');
const Numeral = require('numeral');
const sqlite3 = require('sqlite3');
const Discord = require("discord.js");
const appRoot = require('app-root-path');
const Handlebars = require("handlebars");
const pools = require("./handlers/pools.js");
const users = require("./handlers/users.js");
const rains = require("./handlers/rains.js");
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
const HandlebarHelpers = require('just-handlebars-helpers');

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");

// open the access to the database if it fails we must stop
let db = new sqlite3.Database(path.join(appRoot.path, config.db.filename), sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  }
});

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

// initialize data models
const usersData = new UsersData(db);
const walletsData = new WalletsData(db);
const blockchainData = new BlockchainData();
const giveawaysData = new GiveawaysData(db);

if (config.debug) {
  console.log("initialized data models...");
}

// register the handlebar helpers
HandlebarHelpers.registerHelpers(Handlebars);

// handle all unhandler exceptions
process.on('uncaughtException', err => {
  console.error('There was an uncaught error', err)
  process.exit(1);
});

client.on("ready", () => {
  if (config.debug) {
    console.log("on client ready called...");
  }

  // set the avatar for the bot user
  client.user.setAvatar('./avatar.png').then(user => console.log(`Avatar is set!`)).catch(err => { console.error('Set avatar error', err) });

  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.size} servers`);

  // we are ready so we can initialize the giveaways
  giveawaysData.initialize(function (data) {
    let channel = client.channels.get(data.channel_id);

    if (channel) {
      channel.fetchMessage(data.message_id).then(message => {
        message.reactions.forEach(reaction => {
          if (reaction.emoji.identifier == "%F0%9F%8E%89") {
            reaction.fetchUsers().then(usersList => {
              // exclude all bots from the list of users
              let gaUsers = usersList.filter(user => !user.bot);

              // call the handler for finishing the giveaway
              giveaways.finishGiveaway(giveawaysData, walletsData, message, gaUsers.array());
            }).catch(err => {
              console.error('Failed to fetch reaction users', err);
            });
          }
        });
      }).catch(err => {
        console.error('Giveaway finished error', err);
      });
    }
  });
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

      let welcomeTpl = Handlebars.compile(source);
      let welcomeEmbed = {
        color: 0x0099ff,
        title: "Welcome to Conceal",
        url: 'https://discord.js.org',
        author: {
          name: 'Conceal Network',
          icon_url: 'https://conceal.network/images/branding/logo.png',
          url: 'https://discord.gg/YbpHVSd'
        },
        description: welcomeTpl({ username: member.displayName }),
        timestamp: new Date(),
        footer: {
          text: "Conceal Network",
          icon_url: 'https://conceal.network/images/branding/logo.png'
        }
      };

      member.send({ embed: welcomeEmbed });
    });
  }).catch(err => {
    console.error('Failed to get exchangers', err);
  });
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on('messageReactionAdd', (reaction, user) => {
  // nothing to do so far
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  if (config.debug) {
    console.log(message.content);
  }

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  //if (message.channel.type == "dm") {
  //  return message.channel.send("Bot is not available in DM");
  //}

  if (message && message.author) {
    // update the activity for the current user
    usersData.updateUserActivity(message.author.id).catch(err => {
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
    return giveaways.executeCommand(giveawaysData, walletsData, client, message, command, args);
  }

  if (command === "users") {
    if (args.length == 0) {
      return message.reply(`You need to specify a users command! Type: ***${config.prefix}users help*** for list of commands`);
    }

    // execute the blockchain commands
    return users.executeCommand(usersData, client, message, command, args);
  }

  /************************************************************
   *  Tip command. Take ammount specified and tip the target  *
   *  user. User needs to have a registered wallet otherwise  *
   *  it fails. Also checks the balance first.                *
   ***********************************************************/
  if (command === "tip") {
    let payments = [];
    let amount = 0;

    if (args.length < 2) {
      return message.reply('You need to specify an ammount and a recipient.');
    }

    if (!message.mentions.users.first()) {
      return message.reply('You need to specify at least one recipient.');
    }

    if (message.author.id === message.mentions.users.first().id) {
      return message.reply('You cannot tip yourself silly \:rofl:');
    }

    try {
      amount = parseFloat(args[0]);
      if (!amount || amount < config.restrictions.minTipAmount) throw `Amount cannot be less then ${config.restrictions.minTipAmount} CCX`;
    } catch (err) {
      return message.reply(err);
    }

    // calculate the pay part per every mentioned user
    let payPart = ((amount - 0.001) / message.mentions.users.size);

    message.mentions.users.forEach(user => {
      payments.push({ userId: user.id, amount: payPart });
    });

    // execute the blockchain commands
    return walletsData.sendPayments(message.author.id, payments).then(data => {
      message.author.send(`Success! ***TX hash***: ${data.transactionHash}\n***Secret key***: ${data.transactionSecretKey}`);
      message.channel.send(`\:money_with_wings: Success`);
    }).catch(err => {
      message.author.send(err);
      message.channel.send(`\:x: Failed`);
    }).finally(message.reply('The tip details were send to you in DM'));
  }

  /************************************************************
   *  Rain command. Take ammount specified and number of user *
   *  It then takes latest active users and proportionally    *
   *  rains the CCX specified over all of them                *
   ***********************************************************/
  if (command === "rain") {
    if (args.length == 0) {
      return message.reply(`You need to specify a rain command! Type: ***${config.prefix}rain help*** for list of commands`);
    }

    // execute the rain commands
    return rains.executeCommand(usersData, walletsData, client, message, command, args);
  }

  /************************************************************
   *  General help command. Prints the general help out.      *
   ***********************************************************/
  if (command === "help") {
    function sendNextHelpPart(partNum) {
      fs.readFile(`./templates/help_general_${partNum}.msg`, 'utf8', function (err, source) {
        if (err) throw err;
        message.author.send(source);
      });

      if (partNum < 2) {
        setTimeout(() => {
          sendNextHelpPart(partNum + 1)
        }, 200);
      }
    }

    // warn that help is sent id DM
    if (message.channel.type !== "dm") {
      message.reply('The help information has been sent to you in DM. Consider using DM with the bot for help commands.');
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
    if (message.channel.type == "dm") {
      return message.channel.send("Purge command is not available in DM");
    }

    if (message.member && message.member.roles) {
      // This command removes all messages from all users in the channel, up to 100.
      if (!message.member.roles.some(r => ["admins", "mods"].includes(r.name)))
        return message.reply("Sorry, you don't have permissions to use this!");

      // get the delete count, as an actual number.
      const deleteCount = parseInt(args[0], 10) + 1;

      // Ooooh nice, combined conditions. <3
      if (!deleteCount || deleteCount < 1 || deleteCount > 100)
        return message.reply("Please provide a number between 1 and 100 for the number of messages to delete");

      // So we get our messages, and delete them. Simple enough, right?
      const fetched = await message.channel.fetchMessages({ limit: deleteCount });
      return message.channel.bulkDelete(fetched).catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
    }
  }

  // if we came this far then no command was found
  return message.reply('Unknown command. Please type ".help" for more info on how to use the bot');
});

if (config.debug) {
  console.log("calling client.login...");
}

client.login(config.token);
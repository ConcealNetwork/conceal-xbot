const fs = require('fs');
const config = require('../config.json');

function executeCommand(message, command, args) {
  // Handle help command
  if (args.length > 0 && args[0] === 'help') {
    fs.readFile('./templates/help_social.msg', 'utf8', function (err, source) {
      if (err) throw err;
      message.reply(source);
    });
    return;
  }

  // Handle .social latest
  if (args.length > 0 && args[0] === 'latest') {
    const channelId = config.social.channel;
    if (!channelId) {
      return message.reply('Social channel not configured.');
    }

    message.client.channels
      .fetch(channelId)
      .then((channel) => {
        if (!channel) {
          return message.reply('Twitter channel not found.');
        }

        channel.messages
          .fetch({ limit: 10 })
          .then((messages) => {
            const tweetMessages = [];
            messages.forEach((msg) => {
              const content = msg.content;
              const urlRegex =
                /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/ConcealNetwork\/status\/\d+)/gi;
              const match = content.match(urlRegex);
              if (match) {
                tweetMessages.push({
                  date: msg.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
                  url: match[0],
                });
              }
            });

            if (tweetMessages.length === 0) {
              return message.reply('No recent tweets found in the channel.');
            }

            // Get the latest 3
            const latest = tweetMessages.slice(0, 3);
            let response = 'Latest tweets from Conceal Network:\n';
            latest.forEach((tweet) => {
              response += `\n${tweet.date}: ${tweet.url}`;
            });
            message.reply(response);
          })
          .catch((err) => {
            console.error(err);
            message.reply('Error fetching messages.');
          });
      })
      .catch((err) => {
        console.error(err);
        message.reply('Error fetching channel.');
      });
    return;
  }

  // Handle .social tweet <id>
  if (args.length > 1 && args[0] === 'tweet') {
    const tweetId = args[1];
    if (!/^\d+$/.test(tweetId)) {
      return message.reply('Invalid tweet ID. Must be a number.');
    }
    const url = `https://x.com/ConcealNetwork/status/${tweetId}`;
    message.reply(`Tweet URL: ${url}`);
    return;
  }

  // Unknown command
  message.reply('Unknown social command. Type ".social help" for available commands.');
}

module.exports = {
  executeCommand,
};

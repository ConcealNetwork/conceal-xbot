module.exports = {
  sendHelpContent: function (message, content) {
    if (message.channel.type !== 'dm') {
      message.reply(
        'The help information has been sent to you in DM. Consider using DM with the bot for help commands.'
      );
    }
    // send the help content to DM
    message.author.send(content);
  },
};

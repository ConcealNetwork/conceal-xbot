const fs = require('fs');
const path = require('path');
const utils = require('../helpers/utils.js');
const links = require('../data/links.json');

function executeCommand(message, command, args) {
  // Handle help command
  if (args.length > 0 && args[0] === 'help') {
    fs.readFile('./templates/help_links.msg', 'utf8', function (err, source) {
      if (err) throw err;
      utils.sendHelpContent(message, source);
    });
    return;
  }

  // If no specific link is requested, return all links
  if (args.length === 0) {
    let response = 'Here are all available links:\n';
    for (const [key, value] of Object.entries(links)) {
      response += `\n${key}: ${value}`;
    }
    return message.reply(response);
  }

  // If a specific link is requested, return that link
  const linkName = args[0].toLowerCase();
  if (links[linkName]) {
    return message.reply(`${linkName}: ${links[linkName]}`);
  } else {
    return message.reply(
      `Link '${linkName}' not found. Available links: ${Object.keys(links).join(', ')}`
    );
  }
}

module.exports = {
  executeCommand,
};

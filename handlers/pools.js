const fs = require('fs');
const Handlebars = require("handlebars");
const pools = require("../modules/pools.js");

module.exports = {
  executeCommand: function (message, command, args) {
    if (args[0] === "help") {

      fs.readFile('./templates/help_pools.msg', 'utf8', function (err, source) {
        if (err) throw err;
        var template = Handlebars.compile(source);
        message.channel.send(template(template));
      });
    }

    if (args[0] == "info") {
      // get the basic markets info
      pools.getPoolsInfo().then(data => {
        fs.readFile('./templates/poolinfo.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          // send resply back to the channel
          message.channel.send(template(data));
        });
      }).catch(err => {
        message.channel.send(err);
      });
    }

    if (args[0] == "list") {
      // get the basic markets info
      pools.getPoolsList().then(data => {
        fs.readFile('./templates/poollist.msg', 'utf8', function (err, source) {
          if (err) throw err;

          var template = Handlebars.compile(source);
          // send resply back to the channel
          message.channel.send(template(data));
        });
      }).catch(err => {
        message.channel.send(err);
      });
    }
  }
};
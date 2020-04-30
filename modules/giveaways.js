const config = require("../config.json");
const sqlite3 = require('sqlite3');
const shortid = require('shortid');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

class GiveawaysData {
  constructor(database, onGiveawayEvent) {
    this.db = database;
    this._initializeGiveaways(onGiveawayEvent);
  }

  _setSingleEvent = (data, onEventCallback) => {
    let creationTS = moment(data.creation_ts);
    let eventTS = moment(data.creation_ts).add(data.timespan, 'seconds');
    let timeout = eventTS.diff(creationTS, 'milliseconds');

    setTimeout(() => {
      onEventCallback(data);
    }, timeout);
  }

  _initializeGiveaways = (onEventCallback) => {
    let setSingleEvent = this._setSingleEvent;
    this.db.each("SELECT * from giveaways where is_active = 1", function (err, row) {
      setSingleEvent(row, onEventCallback);
    });
  }

  createEmbedMessage = (title, description, footer) => {
    return {
      color: 0x0099ff,
      title: title,
      url: 'https://discord.js.org',
      author: {
        name: 'Conceal Network',
        icon_url: 'https://conceal.network/images/branding/logo.png',
        url: 'https://discord.gg/YbpHVSd'
      },
      description: description,
      timestamp: new Date(),
      footer: {
        text: footer,
        icon_url: 'https://conceal.network/images/branding/logo.png'
      }
    };
  }

  getGiveaway = (messageId) => {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * from giveaways where message_id = ?", [messageId], function (err, row) {
        if (!err & row) resolve(row);
        else reject("Failed to get Giveaway");
      });
    });
  }

  finishGiveaway = (users, messageId) => {
    return new Promise((resolve, reject) => {

    });
  }

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  createGiveaway = (userId, channelId, messageId, timespan, winners, amount, description) => {
    return new Promise((resolve, reject) => {
      this.db.run(`INSERT INTO giveaways(user_id, channel_id, message_id, creation_ts, description, timespan, amount, winners, is_active) 
                               VALUES(?,?,?,CURRENT_TIMESTAMP,?,?,?,?,1)`,
        [userId, channelId, messageId, description, timespan, amount * config.metrics.coinUnits, winners], function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }
}

module.exports = GiveawaysData;
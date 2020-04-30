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

  _setSingleEvent = (creation_ts, timespan, channelId, messageId, onEventCallback) => {
    let creationTS = moment(creation_ts);
    let eventTS = moment(creation_ts).add(timespan, 'seconds');
    let timeout = eventTS.diff(creationTS, 'milliseconds');

    setTimeout(() => {
      onEventCallback(channelId, messageId);
    }, timeout);
  }

  _initializeGiveaways = (onEventCallback) => {
    let setSingleEvent = this._setSingleEvent;
    this.db.each("SELECT * from giveaways where is_active = 1", function (err, row) {
      setSingleEvent(row.creation_ts, row.timespan, row.channel_id, row.message_id, onEventCallback);
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
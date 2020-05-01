const config = require("../config.json");
const sqlite3 = require('sqlite3');
const shortid = require('shortid');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

class GiveawaysData {
  constructor(database) {
    this.db = database;
    this.onGiveawayEvent = null;
  }

  _setSingleEvent = (data, onEventCallback) => {
    let creationTS = moment(data.creation_ts);
    let eventTS = moment(data.creation_ts).add(data.timespan, 'seconds');
    let timeout = Math.max(0, eventTS.diff(moment(), 'milliseconds'));

    setTimeout(() => {
      onEventCallback(data);
    }, timeout);
  }

  /*********************************************************** *
  *  Initializes the currently active giveaways and add events *
  *************************************************************/
  initialize = (onEventCallback) => {
    let setSingleEvent = this._setSingleEvent;
    this.onGiveawayEvent = onEventCallback;

    this.db.each("SELECT * from giveaways where is_active = 1", function (err, row) {
      setSingleEvent(row, onEventCallback);
    });
  }

  /************************************************************
  *  creates an embed for the discord message for giveaway    *
  ************************************************************/
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

  /************************************************************
   *  Gets a giveaway by row id where it is in the DB         *
   ***********************************************************/
  getGiveawayByRowId = (rowId) => {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * from giveaways where id = ?", [rowId], function (err, row) {
        if (!err && row) resolve(row);
        else reject("Failed to get Giveaway");
      });
    });
  }

  /************************************************************
   *  Gets a giveaway by message id to which it is attached   *
   ***********************************************************/
  getGiveawayByMessageId = (messageId) => {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * from giveaways where message_id = ?", [messageId], function (err, row) {
        if (!err && row) resolve(row);
        else reject("Failed to get giveaway");
      });
    });
  }

  /************************************************************
   *  Lists all active giveaways from all users               *
   ***********************************************************/
  listGiveaways = () => {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * from giveaways where is_active = 1", function (err, rows) {
        if (!err && rows) resolve(rows);
        else reject("Failed to list giveaways");
      });
    });
  }

  /************************************************************
   *  Finishes the giveaway. Basically it just sets the flag  *
   *  that makes the giveawy not active anymore.              *
   ***********************************************************/
  finishGiveaway = (messageId) => {
    return new Promise((resolve, reject) => {
      let getGiveawayByMessageId = this.getGiveawayByMessageId;

      this.db.run('UPDATE giveaways SET is_active = 0 WHERE  message_id = ?', [messageId], function (err) {
        if (!err) {
          getGiveawayByMessageId(messageId).then(data => {
            resolve(data);
          }).catch(err => reject(err));
        } else {
          reject(err);
        }
      });
    });
  }

  /************************************************************
   *  Creates a new giveaway based on parameters. Sets an     *
   *  event for when the giveaway will be triggered.          *
   ***********************************************************/
  createGiveaway = (userId, channelId, messageId, timespan, winners, amount, description) => {
    return new Promise((resolve, reject) => {
      let getGiveawayByRowId = this.getGiveawayByRowId;
      let onGiveawayEvent = this.onGiveawayEvent;
      let setSingleEvent = this._setSingleEvent;

      this.db.run(`INSERT INTO giveaways(user_id, channel_id, message_id, creation_ts, description, timespan, amount, winners, is_active) 
                               VALUES(?,?,?,CURRENT_TIMESTAMP,?,?,?,?,1)`,
        [userId, channelId, messageId, description, timespan, amount * config.metrics.coinUnits, winners], function (err) {
          if (err) {
            reject(err);
          } else {
            getGiveawayByRowId(this.lastID).then(row => {
              setSingleEvent(row, onGiveawayEvent);
              resolve(row);
            }).catch(err => reject(err));
          }
        });
    });
  }
}

module.exports = GiveawaysData;
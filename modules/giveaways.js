const config = require("../config.json");
const sqlite3 = require('sqlite3');
const shortid = require('shortid');
const path = require('path');
const fs = require('fs');

class GiveawaysData {
  constructor(database) {
    this.db = database;
  }

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  createGiveaway = (userId, messageId, description, timespan, amount, winners) => {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO giveaways(user_id, message_id, creation_ts, description, timespan, amount, winners, is_active) VALUES(?,?,CURRENT_TIMESTAMP,?,?,?,?,1)', [userId, messageId, description, timespan, amount, winners], function (err, result) {
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
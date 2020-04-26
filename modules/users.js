const config = require("../config.json");
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class UsersData {
  constructor(database) {
    this.db = database;
  }

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  updateUserActivity = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT OR REPLACE INTO user_activity(userId, timestamp, msgcount) VALUES(?,CURRENT_TIMESTAMP, COALESCE((SELECT msgcount FROM user_activity WHERE userId=?), 0) + 1);)', [userId, userId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = UsersData;
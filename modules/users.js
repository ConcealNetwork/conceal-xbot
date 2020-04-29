const config = require("../config.json");
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class UsersData {
  constructor(database) {
    this.db = database;
  }

  /************************************************************
   *  Function that monitors users last activity I records  . *
   *  timestamp of the user last message and keeps overall    *
   *  user message counter.                                   *
   ***********************************************************/
  updateUserActivity = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT OR REPLACE INTO user_activity(user_id, timestamp, msgcount) VALUES(?,CURRENT_TIMESTAMP, COALESCE((SELECT msgcount FROM user_activity WHERE user_id=?), 0) + 1);)', [userId, userId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /************************************************************
   *  Function that selects "N" last active users on the      *
   *  server and checks that they have the wallet registered. *
   ***********************************************************/
  getLastActiveUsers = (count) => {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT user_activity.user_id from user_activity where user_activity.user_id in (select wallets.user_id from wallets) ORDER BY TIMESTAMP DESC LIMIT ?;', [count], function (err, rows) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = UsersData;
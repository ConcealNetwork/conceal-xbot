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
      this.db.run('INSERT OR REPLACE INTO user_activity(user_id, timestamp, msg_alltime, msg_period) VALUES(?,CURRENT_TIMESTAMP, COALESCE((SELECT msg_alltime FROM user_activity WHERE user_id=?), 0) + 1);, COALESCE((SELECT msg_period FROM user_activity WHERE user_id=?), 0) + 1);)', [userId, userId, userId], function (err) {
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

  /************************************************************
   *  Function that selects "N" most active users of all time *
   *  from the server and checks that they have the wallet    *
   *  registered.                                             *
   ***********************************************************/
  getAllTimeActiveUsers = (count) => {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT user_activity.user_id from user_activity where user_activity.user_id in (select wallets.user_id from wallets) ORDER BY MSG_ALLTIME DESC LIMIT ?;', [count], function (err, rows) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /************************************************************
   *  Function that selects "N" last active users by perios   *
   *  from the server and checks that they have the wallet    *
   *  registered.                                             *
   ***********************************************************/
  getActiveUsersByPeriod = (count) => {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT user_activity.user_id from user_activity where user_activity.user_id in (select wallets.user_id from wallets) ORDER BY MSG_PERIOD DESC LIMIT ?;', [count], function (err, rows) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /************************************************************
   * Resets the period counters for all users in the databese *
   ***********************************************************/
  resetPeriodCounter = () => {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE user_activity SET MSG_PERIOD = 0', function (err, rows) {
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
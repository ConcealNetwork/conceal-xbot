const config = require('../config.json');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class SettingsData {
  constructor(database) {
    this.db = database;
  }

  /*************************************************************
   *  Function that sets the muted status for the user to on.  *
   *  or off. If muted the user will not receive notifications *
   *  in the discord channels                                  *
   ************************************************************/
  setMutedState = (userId, state) => {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings(user_id, muted) VALUES(?,?)',
        [userId, state ? 1 : 0],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  };

  /*************************************************************
   *  Function that sets the muted status for the user to on.  *
   *  or off. If muted the user will not receive notifications *
   *  in the discord channels                                  *
   ************************************************************/
  getMutedState = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT settings.muted FROM settings WHERE settings.user_id = ?',
        [userId],
        function (err, row) {
          if (err) {
            reject(err);
          } else {
            if (row) {
              resolve(row.muted == 1);
            } else {
              resolve(false);
            }
          }
        }
      );
    });
  };
}

module.exports = SettingsData;

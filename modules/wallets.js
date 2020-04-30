const appRoot = require('app-root-path');
const config = require("../config.json");
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');
const CCXApi = require("conceal-api");
const crypto = require("crypto");
const path = require('path');
const fs = require('fs');

class WalletsData {
  constructor(database) {
    this.CCX = new CCXApi("http://127.0.0.1", config.wallet.port, config.daemon.port, (config.wallet.rfcTimeout || 5) * 1000);
    this.db = database;

    // load the data file
    if (fs.existsSync(path.join(appRoot.path, "data.json"))) {
      this.dataFile = jsonfile.readFileSync(path.join(appRoot.path, "data.json"));
    } else {
      this.dataFile = { lastBlock: 1 };
    }

    // set the standard fee for tipping
    this.fee = 0.001 * config.metrics.coinUnits;
    // periodically sync transactions
    this._synchronizeTransactions(true);
  }

  _isValidAddress = (str, len) => {
    //return ((typeof str === 'string') && /^[0-9a-fA-F]{64}$/.test(str) && (str.length == len));
    return str.length == len;
  }

  _SyncBlockArray = (txdata) => {
    return new Promise((resolve, reject) => {
      let blockCount = txdata.items.length;
      let localDB = this.db;

      if (blockCount == 0) {
        resolve();
      } else {
        txdata.items.forEach(function (valueBlock, idxBlock) {
          let txCount = valueBlock.transactions.length;

          if ((txCount == 0) && (idxBlock == blockCount - 1)) {
            resolve();
          } else {
            valueBlock.transactions.forEach(function (valueTx, idxTx) {
              localDB.run('INSERT OR REPLACE INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(?,?,?,?,?)', [valueTx.blockIndex, valueTx.paymentId, valueTx.timestamp, valueTx.amount, valueTx.transactionHash], function (err) {
                if (err) {
                  reject(false);
                } else {
                  if ((idxBlock == blockCount - 1) && (idxTx == txCount - 1)) {
                    resolve(true);
                  }
                }
              });
            });
          }
        });
      }
    });
  }

  /************************************************************
   *  Internal function that fetches the next blocks array.   *
   *  Works recursivly until we do not pass the current block *
   *  height. It returns the current block height as result.  *
   ***********************************************************/
  _fetchNextBlockArray = (startIndex, currentHeight) => {
    return new Promise(async resolve => {
      if (startIndex < currentHeight) {
        const opts = {
          firstBlockIndex: startIndex,
          blockCount: 1000,
        }

        this.CCX.getTransactions(opts).then(txdata => {
          this._SyncBlockArray(txdata).then(data => {
            resolve(this._fetchNextBlockArray(Math.min(startIndex + 1000, currentHeight), currentHeight));
          }).catch(err => {
            reject(err);
          });
        });
      } else {
        resolve(currentHeight);
      }
    });
  }

  /************************************************************
   *  Internal function that synchronizes local SQLite DB     *
   *  with the blockchain data. It periodically checks for    *
   *  new transaction and looks at payment_id for matching.   *
   ***********************************************************/
  _synchronizeTransactions = (periodic) => {
    let synchronizeTransactions = this._synchronizeTransactions;

    return new Promise(async resolve => {
      this.CCX.info().then(data => {
        this._fetchNextBlockArray(this.dataFile.lastBlock, data.height).then(lastHeight => {
          this.dataFile.lastBlock = lastHeight;
          jsonfile.writeFileSync(path.join(appRoot.path, "data.json"), this.dataFile, { spaces: 2 });

          if (periodic) {
            setTimeout(function () {
              resolve(synchronizeTransactions(periodic));
            }, 300000);
          } else {
            resolve(lastHeight);
          }
        }).catch(err => {
          reject(err);
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  generatePaymentId = () => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(32, function (err, buffer) {
        resolve(buffer.toString('hex'));
      });
    });
  }

  registerWallet = (userId, userName, address) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (row) {
          reject("User already has a registered wallet!");
        } else {
          // check if its a valid CCX address
          if (!this._isValidAddress(address, 98)) {
            reject("Please provide a valid CCX address");
          }

          this.generatePaymentId().then(payment_id => {
            this.db.run('INSERT INTO wallets(address, user_id, user_name, payment_id) VALUES(?,?,?,?)', [address, userId, userName, payment_id], function (err) {
              if (err) reject(err);
              else resolve("Successfully registered wallet");
            });
          });
        }
      });
    });
  }

  updateWallet = (userId, address) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (!row) {
          reject('You are not registered yet. Please use a "register" command');
        } else {
          // check if its a valid CCX address
          if (!this._isValidAddress(address, 98)) {
            reject("Please provide a valid CCX address");
          }

          this.db.run('UPDATE wallets SET address = ? where user_id = ?', [address, userId], function (err) {
            if (err) reject(err);
            else resolve("Successfully updated wallet");
          });
        }
      });
    });
  }

  showWalletInfo = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (row) resolve({ address: row.address, payment_id: row.payment_id });
        else reject("Failed to find info for the user");
      });
    });
  }

  getBalance = (userId) => {
    return new Promise((resolve, reject) => {
      this._synchronizeTransactions(false).then(lastHeight => {
        this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, user_row) => {
          if (!err && user_row) {
            this.db.get('SELECT SUM(amount) as "balance" FROM transactions WHERE payment_id = ?', [user_row.payment_id], (err, balance_row) => {
              if (!err && balance_row) {
                this.db.get('SELECT SUM(amount) as "balance" FROM giveaways WHERE user_id = ?', [userId], (err, giveaway_row) => {
                  if (!err && giveaway_row) {
                    let txBalance = balance_row.balance || 0;
                    let gaBalance = giveaway_row.balance || 0;
                    resolve({ balance: txBalance - gaBalance, payment_id: user_row.payment_id });
                  } else {
                    reject("Failed to get balance for the user");
                  }
                });
              } else {
                reject("Failed to get balance for the user");
              }
            });
          } else {
            reject("Failed to find info for the user");
          }
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  sendPayment = (fromUserId, toUserId, amount) => {
    return new Promise((resolve, reject) => {

      // write transaction to the sqlite database
      let doWriteTransaction = (paymentId, txhash) => {
        this.db.run('INSERT INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(0,?,0,?,?)', [paymentId, -1 * ((amount * config.metrics.coinUnits) + this.fee), txhash.transactionHash], function (err) {
          if (!err) resolve(txhash);
          else reject(err);
        });
      }

      // call the wallet RFC to send the transaction
      let doSendPayment = (address, paymentId) => {
        const opts = {
          transfers: [{ address: address, amount: amount * config.metrics.coinUnits }],
          fee: this.fee,
          anonimity: 4,
          paymentId: paymentId
        }

        this.CCX.sendTransaction(opts).then(txhash => {
          doWriteTransaction(paymentId, txhash);
        }).catch(err => {
          reject(err);
        });
      }

      // get target user data from sqlite DB
      let doGetTargetUserData = (userId, paymentId) => {
        this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
          if (!err && row) doSendPayment(row.address, paymentId);
          else reject("failed to get target user info");
        });
      }

      // get balance first and check if its enough
      this.getBalance(fromUserId).then(balanceData => {
        if (balanceData.balance > ((amount * config.metrics.coinUnits) + this.fee)) {
          doGetTargetUserData(toUserId, balanceData.payment_id);
        } else {
          reject(`insuficient balance ${balanceData.balance / config.metrics.coinUnits} CCX`);
        }
      }).catch(err => {
        reject(err);
      });
    });
  }
}

module.exports = WalletsData;
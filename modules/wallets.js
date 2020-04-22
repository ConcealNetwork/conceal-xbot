const appRoot = require('app-root-path');
const config = require("../config.json");
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');
const CCXApi = require("conceal-api");
const crypto = require("crypto");
const path = require('path');
const fs = require('fs');

class TipBotStorage {
  constructor() {
    this.CCXWallet = new CCXApi("http://127.0.0.1", config.wallet.port, config.daemon.port, (config.wallet.rfcTimeout || 5) * 1000);
    this.db = new sqlite3.Database(path.join(appRoot.path, "tipbot.db"), sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.log('Could not connect to database', err);
      }
    });

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

  _isHex64String = (str, len) => {
    return ((typeof str === 'string') && /^[0-9a-fA-F]{64}$/.test(str) && (str.length = len));
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

        this.CCXWallet.getTransactions(opts).then(txdata => {
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
      this.CCXWallet.info().then(data => {
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

  registerWallet = (userId, userName, address, resultCallback) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (row) {
          reject("User already has a registered wallet!");
        } else {
          // check if its a valid CCX address
          if (!_isHex64String(address, 98)) {
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

  showWalletInfo = (userId, resultCallback) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (row) resolve({ address: row.address, payment_id: row.payment_id });
        else reject("Failed to find info for the user");
      });
    });
  }

  getBalance = (userId, resultCallback) => {
    return new Promise((resolve, reject) => {
      this._synchronizeTransactions(false).then(lastHeight => {
        this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, user_row) => {
          if (!err && user_row) {
            this.db.get('SELECT SUM(amount) as "balance" FROM transactions WHERE payment_id = ?', [user_row.payment_id], (err, balance_row) => {
              if (!err && balance_row) resolve({ balance: balance_row.balance || 0, payment_id: user_row.payment_id });
              else reject("Failed to get balance for the user");
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
    let localCCX = this.CCXWallet;
    let localFee = this.fee;
    let localDB = this.db;

    return new Promise((resolve, reject) => {

      function checkForPendingTransactions(userId) {
        return new Promise((resolve, reject) => {
          localDB.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, user_row) => {
            if (!err && user_row) {
              if (user_row.last_tip_tx) {
                this.db.get('SELECT * FROM transactions WHERE tx_hash = ?', [user_row.last_tip_tx], (err, tx_row) => {
                  if (!err && tx_row) resolve(tx_row);
                  else reject(err || "The wallet is not fully synchronized. Try again later.")
                });
              } else {
                resolve(null);
              }
            } else {
              reject(err || "Could not find user!");
            }
          });
        });
      }

      // write transaction to the sqlite database
      function doWriteTransaction(paymentId, txhash) {
        localDB.run('INSERT INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(0,?,0,?,?)', [paymentId, -1 * ((amount * config.metrics.coinUnits) + localFee), txhash.transactionHash], function (err) {
          if (!err) resolve(txhash);
          else reject(err);
        });
      }

      // call the wallet RFC to send the transaction
      function doSendPayment(address, paymentId) {
        const opts = {
          transfers: [{ address: address, amount: amount * config.metrics.coinUnits }],
          fee: localFee,
          anonimity: 4,
          paymentId: paymentId
        }

        localCCX.sendTransaction(opts).then(txhash => {
          doWriteTransaction(paymentId, txhash);
        }).catch(err => {
          reject(err);
        });
      }

      // get target user data from sqlite DB
      function doGetTargetUserData(userId) {
        localDB.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
          if (!err && row) doSendPayment(row.address, row.payment_id);
          else reject("failed to get target user info");
        });
      }

      // get balance first and check if its enough
      this.getBalance(fromUserId).then(balanceData => {
        if (balanceData.balance > ((amount * config.metrics.coinUnits) + localFee)) {
          // first check for pending TXs
          checkForPendingTransactions(fromUserId).then(txData => {
            doGetTargetUserData(toUserId);
          }).catch(err => {
            reject(err);
          });
        } else {
          reject(`insuficient balance ${balanceData.balance / config.metrics.coinUnits}`);
        }
      }).catch(err => {
        reject(err);
      });
    });
  }
}

module.exports = TipBotStorage;
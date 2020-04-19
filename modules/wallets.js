const appRoot = require('app-root-path');
const config = require("../config.json");
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');
const CCXApi = require("conceal-api");
const crypto = require("crypto");
const path = require('path');


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

    // periodically sync transactions
    this._synchronizeTransactions(true);
  }

  _SyncBlockArray = (txdata, callback) => {
    let blockCount = txdata.items.length;
    let localDB = this.db;

    if (blockCount == 0) {
      callback();
    } else {
      txdata.items.forEach(function (valueBlock, idxBlock) {
        let txCount = valueBlock.transactions.length;

        if ((txCount == 0) && (idxBlock == blockCount - 1)) {
          callback();
        } else {
          valueBlock.transactions.forEach(function (valueTx, idxTx) {
            localDB.run('INSERT INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(?,?,?,?,?)', [valueTx.blockIndex, valueTx.paymentId, valueTx.timestamp, valueTx.amount, valueTx.transactionHash], function (err) {
              if (err) {
                console.log(error);
              } else {
                if ((idxBlock == blockCount - 1) && (idxTx == txCount - 1)) {
                  callback();
                }
              }
            });
          });
        }
      });
    }
  }

  _fetchNextBlockArray = (startIndex, currentHeight, finishedCallback) => {
    let fetchNextBlockArray = this._fetchNextBlockArray;

    if (startIndex < currentHeight) {
      const opts = {
        firstBlockIndex: startIndex,
        blockCount: 1000,
      }

      this.CCXWallet.getTransactions(opts).then(txdata => {
        this._SyncBlockArray(txdata, function () {
          fetchNextBlockArray(Math.min(startIndex + 1000, currentHeight), currentHeight, finishedCallback);
        });
      });
    } else {
      finishedCallback();
    }
  }

  /************************************************************
   *  Internal function that synchronizes local SQLite DB     *
   *  with the blockchain data. It periodically checks for    *
   *  new transaction and looks at payment_id for matching.   *
   ***********************************************************/
  _synchronizeTransactions = (periodic, finishedCallback) => {
    this.CCXWallet.info().then(data => {
      this._fetchNextBlockArray(this.dataFile.lastBlock, data.height, function () {
        jsonfile.writeFileSync(path.join(appRoot.path, "data.json"), this.dataFile, { spaces: 2 })

        if (finishedCallback) {
          finishedCallback();
        }

        if (periodic) {
          setTimeout(function () {
            this._synchronizeTransactions(periodic, finishedCallback);
          }, 300000);
        }
      });
    }).catch(err => {
      console.log(err);
    });
  }

  generatePaymentId = (resultCallback) => {
    crypto.randomBytes(32, function (err, buffer) {
      resultCallback(buffer.toString('hex'));
    });
  }

  registerWallet = (userId, userName, address, resultCallback) => {
    this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
      if (row) {
        resultCallback({ success: false, reason: "User already has a registered wallet!" });
      } else {
        var localDB = this.db;
        this.generatePaymentId(function (payment_id) {
          localDB.run('INSERT INTO wallets(address, user_id, user_name, payment_id) VALUES(?,?,?,?)', [address, userId, userName, payment_id], function (err) {
            if (err) {
              resultCallback({ success: false, reason: err.message });
            } else {
              resultCallback({ success: true, reason: "Successfully registered wallet" });
            }
          });
        });
      }
    });
  }

  showWalletInfo = (userId, resultCallback) => {
    this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
      if (row) {
        resultCallback({ success: true, address: row.address, payment_id: row.payment_id });
      } else {
        resultCallback({ success: false, reason: "Failed to find info for the user" });
      }
    });
  }

  getBalance = (userId, resultCallback) => {
    let localDB = this.db;

    this._synchronizeTransactions(false, function () {
      localDB.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, user_row) => {
        if (!err && user_row) {
          localDB.get('SELECT SUM(amount) as "balance" FROM transactions WHERE payment_id = ?', [user_row.payment_id], (err, balance_row) => {
            if (!err && balance_row) {
              resultCallback({ success: true, balance: balance_row.balance, payment_id: user_row.payment_id });
            } else {
              resultCallback({ success: false, reason: "Failed to get balance for the user" });
            }
          });
        } else {
          resultCallback({ success: false, reason: "Failed to find info for the user" });
        }
      });
    });
  }

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  sendPayment = (userId, targetUser, amount, resultCallback) => {

    // write transaction to the sqlite database
    function doWriteTransaction(address, payment_id, txdata) {
      localDB.run('INSERT INTO transactions(user_id, target_user, target_address, payment_id, amount, tx_hash) VALUES(?,?,?,?,?)', [userId, targetUser, address, payment_id, amount, txdata.hash], function (err) {
        if (err) {
          resultCallback({ success: true, reason: err });
        } else {
          resultCallback({ success: true, data: txdata });
        }
      });
    }

    // call the wallet RFC to send the transaction
    function doSendPayment(address, payment_id) {
      const opts = {
        transfers: [{ address: address, amount: amount * config.metrics.coinUnits }],
        fee: 0.001 * config.metrics.coinUnits,
        anonimity: 4,
        paymentId: payment_id
      }

      this.CCXWallet.send(opts).then(txdata => {
        doWriteTransaction(address, payment_id, txdata);
      }).catch(err => {
        resultCallback({ success: false, reason: err });
      });
    }

    // get target user data from sqlite DB
    function doGetTargetUserData(payment_id) {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [targetUser], (err, row) => {
        if (!err && row) {
          doSendPayment(row.address, amount, payment_id)
        } else {
          resultCallback({ success: false, reason: "failed to get target user info" });
        }
      });
    }

    // get balance first and check if its enough
    this.getBalance(userId, function (balanceData) {
      if (data.success) {
        if (balanceData.balance > amount * config.metrics.coinUnits) {
          doGetTargetUserData(balanceData.payment_id);
        } else {
          resultCallback({ success: false, reason: "insuficient balance" });
        }
      } else {
        resultCallback({ success: false, reason: data.reason });
      }
    });
  }
}

module.exports = TipBotStorage;
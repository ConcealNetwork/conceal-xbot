const appRoot = require('app-root-path');
const config = require("../config.json");
const sqlite3 = require('sqlite3');
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
        resultCallback({ success: false, reason: "User already has a registered wallet!" });
      }
    });
  }

  getBalance = (userId, resultCallback) => {
    let balance = 0;

    this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, source_row) => {
      if (!err && source_row) {
        this.CCXWallet.payments(source_row.payment_id).then(data => {
          data.payments.forEach(function (value, index, array) {
            balance = balance + value.amount;
          });

          this.db.all("SELECT amount FROM transactions where user_id = ?", [userId], function (err, rows) {
            if (err) {
              resultCallback({ success: false, reason: err });
            } else {
              rows.forEach(function (row) {
                balance = balance - row.amount;
              });

              // return the balance for the current user
              resultCallback({ success: false, balance: balance, payment_id: source_row.payment_id });
            }

          });
        }).catch(err => {
          resultCallback({ success: false, reason: err });
        });
      } else {
        resultCallback({ success: false, reason: "failed to get user info" });
      }
    });
  }

  sendPayment = (userId, targetUser, amount, resultCallback) => {
    this.getBalance(userId, function (balanceData) {
      if (data.success) {
        if (balanceData.balance > amount * config.metrics.coinUnits) {
          this.db.get('SELECT * FROM wallets WHERE user_id = ?', [targetUser], (err, target_row) => {
            if (!err && target_row) {
              const opts = {
                transfers: [{ address: target_row.address, amount: amount * config.metrics.coinUnits }],
                fee: 0.001 * config.metrics.coinUnits,
                anonimity: 4,
                paymentId: target_row.payment_id
              }

              this.CCXWallet.send(opts).then(txdata => {
                localDB.run('INSERT INTO transactions(user_id, target_user, target_address, payment_id, amount, tx_hash) VALUES(?,?,?,?,?)', [userId, targetUser, target_row.address, balanceData.payment_id, amount, txdata.hash], function (err) {
                  if (err) {
                    resultCallback({ success: true, reason: err });
                  } else {
                    resultCallback({ success: true, data: txdata });
                  }
                });
              }).catch(err => {
                resultCallback({ success: false, reason: err });
              });
            } else {
              resultCallback({ success: false, reason: "failed to get target user info" });
            }
          });
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
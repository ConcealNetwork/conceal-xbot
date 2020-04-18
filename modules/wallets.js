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

  getPayments = (paymentId, resultCallback) => {
    this.CCXWallet.payments(paymentId).then(data => {
      console.log(data);
    }).catch(err => {
      console.log(err);
    });
  }
}

module.exports = TipBotStorage;
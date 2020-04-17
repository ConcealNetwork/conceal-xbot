const request = require("request");
const sqlite3 = require('sqlite3');
const crypto = require("crypto");


class TipBotStorage {
  constructor() {
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

  registerWallet = (userId, address, resultCallback) => {
    this.db.get('SELECT * FROM wallets WHERE userId = ?', [userId], (err, row) => {
      if (row) {
        resultCallback({ success: false, reason: "User already has a registered wallet!" });
      } else {
        this.generatePaymentId(function (payment_id) {
          db.run(`INSERT INTO wallets(address, user_id, payment_id) VALUES(?,?,?)`, [userId, address, payment_id], function (err) {
            // 
          });
        });
      }
    });
  };
}

const tipBotStorage = new TipBotStorage();
export default tipBotStorage;
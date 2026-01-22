const { spawn } = require('node:child_process');
const appRoot = require('app-root-path');
const config = require('../config.json');
const sqlite3 = require('sqlite3');
const jsonfile = require('jsonfile');
const CCXApi = require('conceal-api');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class WalletsData {
  constructor(database) {
    this.isSyncincTransactions = false;
    this.db = database;

    this.CCX = new CCXApi({
      daemonHost: 'http://127.0.0.1',
      walletHost: 'http://127.0.0.1',
      walletRpcPort: config.wallet.port,
      daemonRpcPort: config.daemon.port,
      timeout: (config.wallet.rfcTimeout || 5) * 1000,
    });

    // load the data file
    if (fs.existsSync(path.join(appRoot.path, 'data.json'))) {
      this.dataFile = jsonfile.readFileSync(path.join(appRoot.path, 'data.json'));
    } else {
      this.dataFile = { lastBlock: 1 };
    }

    // set the standard fee for tipping
    this.fee = 0.001 * config.metrics.coinUnits;
    // do initial sync transactions action
    setTimeout(() => {
      this._synchronizeTransactions().catch((err) => {
        console.log(`Failed to synchronize transactions: ${err}`);
      });
    }, 10000);

    setInterval(() => {
      // periodically sync transactions
      this._synchronizeTransactions().catch((err) => {
        console.log(`Failed to synchronize transactions: ${err}`);
      });
    }, config.wallet.syncInterval * 1000);

    if (config.wallet.optimize) {
      setInterval(
        () => {
          // periodically optimize the wallet
          (async () => {
            try {
              let optimizer = spawn(config.wallet.optimize.execPath, ['--walletd-port=6061']);
            } catch (error) {
              console.error(error);
            }
            //=> 'unicorns'
          })();
        },
        config.wallet.optimize.interval * 3600 * 1000
      );
    }
  }

  _isValidAddress = (str, len) => {
    //return ((typeof str === 'string') && /^[0-9a-fA-F]{64}$/.test(str) && (str.length == len));
    return str.length == len;
  };

  _SyncBlockArray = (txdata) => {
    return new Promise((resolve, reject) => {
      let blockCount = txdata.items.length;
      let localDB = this.db;

      if (blockCount == 0) {
        resolve();
      } else {
        txdata.items.forEach(function (valueBlock, idxBlock) {
          let txCount = valueBlock.transactions.length;

          if (txCount == 0 && idxBlock == blockCount - 1) {
            resolve();
          } else {
            valueBlock.transactions.forEach(function (valueTx, idxTx) {
              localDB.run(
                'INSERT OR REPLACE INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(?,?,?,?,?)',
                [
                  valueTx.blockIndex,
                  valueTx.paymentId,
                  valueTx.timestamp,
                  valueTx.amount,
                  valueTx.transactionHash,
                ],
                function (err) {
                  if (err) {
                    reject(false);
                  } else {
                    if (idxBlock == blockCount - 1 && idxTx == txCount - 1) {
                      resolve(true);
                    }
                  }
                }
              );
            });
          }
        });
      }
    });
  };

  /************************************************************
   *  Internal function that fetches the next blocks array.   *
   *  Works recursivly until we do not pass the current block *
   *  height. It returns the current block height as result.  *
   ***********************************************************/
  _fetchNextBlockArray = (startIndex, currentHeight, errCount) => {
    return new Promise((resolve, reject) => {
      if (startIndex < currentHeight) {
        const opts = {
          firstBlockIndex: startIndex,
          blockCount: 10000,
        };

        this.CCX.getTransactions(opts)
          .then((txdata) => {
            this._SyncBlockArray(txdata)
              .then((data) => {
                setTimeout(() => {
                  resolve(
                    this._fetchNextBlockArray(
                      Math.min(startIndex + 10000, currentHeight),
                      currentHeight,
                      0
                    )
                  );
                }, 100);
              })
              .catch((err) => {
                reject(err);
              });
          })
          .catch((err) => {
            if (errCount < 5) {
              setTimeout(() => {
                resolve(
                  this._fetchNextBlockArray(
                    Math.min(startIndex, currentHeight),
                    currentHeight,
                    errCount + 1
                  )
                );
              }, 1000);
            } else {
              reject(err);
            }
          });
      } else {
        resolve(currentHeight);
      }
    });
  };

  /************************************************************
   *  Internal function that synchronizes local SQLite DB     *
   *  with the blockchain data. It periodically checks for    *
   *  new transaction and looks at payment_id for matching.   *
   ***********************************************************/
  _synchronizeTransactions = () => {
    if (config.debug) {
      console.log('_synchronizeTransactions started...');
    }

    let logSycnhronizationEnded = () => {
      this.isSyncincTransactions = false;

      if (config.debug) {
        console.log('_synchronizeTransactions ended.');
      }
    };

    return new Promise((resolve, reject) => {
      if (!this.isSyncincTransactions) {
        this.isSyncincTransactions = true;

        this.CCX.info()
          .then((data) => {
            this._fetchNextBlockArray(this.dataFile.lastBlock, data.height, 0)
              .then((lastHeight) => {
                this.dataFile.lastBlock = lastHeight;
                jsonfile.writeFileSync(path.join(appRoot.path, 'data.json'), this.dataFile, {
                  spaces: 2,
                });
                logSycnhronizationEnded();
                resolve(lastHeight);
              })
              .catch((err) => {
                logSycnhronizationEnded();
                reject(err);
              });
          })
          .catch((err) => {
            logSycnhronizationEnded();
            reject(err);
          });
      } else {
        reject('Synchronization is already in progress, exiting...');
      }
    });
  };

  generatePaymentId = () => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(32, function (err, buffer) {
        resolve(buffer.toString('hex'));
      });
    });
  };

  /************************************************************
   *  Register a new wallet for the user.                     *
   ***********************************************************/
  registerWallet = (userId, userName, address) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (errGetWallet, row) => {
        if (errGetWallet) {
          reject(errGetWallet);
        } else if (row) {
          reject('User already has a registered wallet!');
        } else {
          // check if its a valid CCX address
          if (!this._isValidAddress(address, 98)) {
            reject('Please provide a valid CCX address');
            return;
          }

          this.generatePaymentId()
            .then((payment_id) => {
              this.db.run(
                'INSERT INTO wallets(address, user_id, user_name, payment_id) VALUES(?,?,?,?)',
                [address, userId, userName, payment_id],
                function (errGenPaymentId) {
                  if (errGenPaymentId) reject(errGenPaymentId);
                  else resolve('Successfully registered wallet');
                }
              );
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    });
  };

  /************************************************************
   *  Update the wallet address for the user.                 *
   ***********************************************************/
  updateWallet = (userId, address) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (errGetWallet, row) => {
        if (errGetWallet) {
          reject(errGetWallet);
        } else if (!row) {
          reject('You are not registered yet. Please use a "register" command');
        } else {
          // check if its a valid CCX address
          if (!this._isValidAddress(address, 98)) {
            reject('Please provide a valid CCX address');
            return;
          }

          this.db.run(
            'UPDATE wallets SET address = ? where user_id = ?',
            [address, userId],
            function (errUpdateWallet) {
              if (errUpdateWallet) reject(errUpdateWallet);
              else resolve('Successfully updated wallet');
            }
          );
        }
      });
    });
  };

  /************************************************************
   *  Get the wallet info by the user ID.                     *
   ***********************************************************/
  showWalletInfo = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (!err && row) resolve({ address: row.address, payment_id: row.payment_id });
        else reject('Failed to find info for the user');
      });
    });
  };

  /************************************************************
   *  Checks if the user has a wallet registered.             *
   ***********************************************************/
  userHasWallet = (userId) => {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM wallets WHERE user_id = ?', [userId], (err, row) => {
        if (!err) resolve(row !== undefined);
        else reject(err);
      });
    });
  };

  /**************************************************************
   *  Get current balance of the user. It take all transactions *
   *  and all giveaways and sums it all together to get balance *
   *************************************************************/
  getBalance = (userId) => {
    let doGetTransactionsSum = (paymentId) => {
      return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT SUM(amount) as "balance" FROM transactions WHERE payment_id = ?',
          [paymentId],
          (err, balance_row) => {
            if (!err && balance_row) resolve(balance_row.balance || 0);
            else reject(err);
          }
        );
      });
    };

    let doGetGiveawaySum = () => {
      return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT SUM(amount) as "balance" FROM giveaways WHERE is_active = 1 and user_id = ?',
          [userId],
          (err, balance_row) => {
            if (!err && balance_row) resolve(balance_row.balance || 0);
            else reject(err);
          }
        );
      });
    };

    return new Promise((resolve, reject) => {
      (async () => {
        let userData = await this.showWalletInfo(userId);
        let txBalance = await doGetTransactionsSum(userData.payment_id);
        let gaBalance = await doGetGiveawaySum();
        // send back the balance info and the user payment_id info
        resolve({ balance: txBalance - gaBalance, payment_id: userData.payment_id });
      })().catch((e) => reject('Failed to find info for the user'));
    });
  };

  /************************************************************
   *  Function to send the payment to specified user from DB. *
   *  Checks the available balance first to see if there is   *
   *  enough found to be able to send out the tip.            *
   ***********************************************************/
  sendPayments = (fromUserId, payments) => {
    return new Promise((resolveSend, rejectSend) => {
      // write transaction to the sqlite database
      let doWriteTransaction = (sumAmount, paymentId, txData) => {
        return new Promise((resolveWriteTx, rejectWriteTx) => {
          this.db.run(
            'INSERT INTO transactions(block, payment_id, timestamp, amount, tx_hash) VALUES(0,?,0,?,?)',
            [paymentId, -1 * (sumAmount + this.fee), txData.transactionHash],
            function (err) {
              if (!err) resolveWriteTx(txData);
              else rejectWriteTx(err);
            }
          );
        });
      };

      // call the wallet RFC to send the transaction
      let doSendPayments = (transfers, paymentId) => {
        return new Promise((resolvePayment, rejectPayment) => {
          const opts = {
            transfers: transfers,
            fee: this.fee,
            anonimity: config.wallet.mixins,
            paymentId: paymentId,
          };

          this.CCX.sendTransaction(opts)
            .then((txhash) => {
              resolvePayment(txhash);
            })
            .catch((err) => {
              rejectPayment(err);
            });
        });
      };

      // calculate the sumAmount first
      let aSumAmount = payments.reduce(
        (total, item) => total + Math.trunc(item.amount * config.metrics.coinUnits),
        0
      );

      // get balance first and check if its enough
      this.getBalance(fromUserId)
        .then((balanceData) => {
          if (balanceData.balance > aSumAmount + this.fee) {
            (async () => {
              let transfers = [];

              // construct a transfers payload
              for (let i = 0; i < payments.length; i++) {
                let walletInfo = await this.showWalletInfo(payments[i].userId);
                transfers.push({
                  address: walletInfo.address,
                  amount: Math.trunc(payments[i].amount * config.metrics.coinUnits),
                });
              }

              // send all the payments and if succesfull write the stub transaction
              let txData = await doSendPayments(transfers, balanceData.payment_id);
              await doWriteTransaction(aSumAmount, balanceData.payment_id, txData);
              resolveSend(txData);
            })().catch((e) => rejectSend(e));
          } else {
            rejectSend(
              `Insufficient balance ${balanceData.balance / config.metrics.coinUnits} CCX`
            );
          }
        })
        .catch((err) => {
          rejectSend(err);
        });
    });
  };
}

module.exports = WalletsData;

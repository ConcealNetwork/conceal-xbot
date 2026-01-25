const config = require('../config.json');
const CCXApi = require('conceal-api');
const axios = require('axios');

class BlockchainData {
  constructor() {
    this.CCX = new CCXApi({
      daemonHost: 'http://127.0.0.1',
      walletHost: 'http://127.0.0.1',
      walletRpcPort: config.wallet.port,
      daemonRpcPort: config.daemon.port,
      timeout: (config.wallet.rfcTimeout || 5) * 1000,
    });
  }

  getInfo = () => {
    return new Promise((resolve, reject) => {
      this.CCX.info()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  getBlockInfo = (hash) => {
    return new Promise((resolve, reject) => {
      this.CCX.block(hash)
        .then((data) => {
          resolve(data.block);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  getLastHeaderInfo = () => {
    return new Promise((resolve, reject) => {
      this.CCX.lastBlockHeader()
        .then((data) => {
          resolve(data.block_header);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  getNodeCount = () => {
    return new Promise((resolve, reject) => {
      axios.get('https://explorer.conceal.network/q/nodecount/')
        .then((response) => {
          resolve(parseInt(response.data, 10));
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  getSmartNodeCount = () => {
    return new Promise((resolve, reject) => {
      axios.get('https://explorer.conceal.network/q/smartnodecount/')
        .then((response) => {
          resolve(parseInt(response.data, 10));
        })
        .catch((err) => {
          reject(err);
        });
    });
  };
}

module.exports = BlockchainData;

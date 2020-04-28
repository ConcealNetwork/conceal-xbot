const config = require("../config.json");
const CCXApi = require("conceal-api");

class BlockchainData {
  constructor() {
    this.CCX = new CCXApi("http://127.0.0.1", config.wallet.port, config.daemon.port, (config.wallet.rfcTimeout || 5) * 1000);
  }

  getInfo = () => {
    return new Promise((resolve, reject) => {
      this.CCX.info()
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  }

  getBlockInfo = (hash) => {
    return new Promise((resolve, reject) => {
      this.CCX.block(hash)
        .then(data => resolve(data.block))
        .catch(err => reject(err));
    });
  }

  getLastHeaderInfo = () => {
    return new Promise((resolve, reject) => {
      this.CCX.lastBlockHeader()
        .then(data => resolve(data.block_header))
        .catch(err => reject(err));
    });
  }
}

module.exports = BlockchainData;
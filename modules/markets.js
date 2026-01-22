const fs = require('fs');
const shortid = require('shortid');
const axios = require('axios');
const https = require('https');

module.exports = {
  getExchanges: function () {
    return axios
      .get('https://explorer.conceal.network/services/exchanges/list', {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
      .then((response) => response.data)
      .catch((err) => Promise.reject(err));
  },
  getMarketInfo: function () {
    return axios
      .get(
        'https://api.coingecko.com/api/v3/simple/price?ids=conceal&vs_currencies=eth%2Cbtc%2Cusd%2Ceur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true',
        {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      )
      .then((response) => response.data)
      .catch((err) => Promise.reject(err));
  },
  getPriceChart: function () {
    return new Promise((resolve, reject) => {
      let url = 'https://explorer.conceal.network/services/charts/price.png';
      let filename = `./images/${shortid.generate()}.png`;

      axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
        .then((response) => {
          const writer = fs.createWriteStream(filename);
          response.data.pipe(writer);
          writer.on('finish', () => resolve(filename));
          writer.on('error', reject);
        })
        .catch(reject);
    });
  },
};

const fs = require('node:fs');
const shortid = require('shortid');
const axios = require('axios');
const https = require('node:https');

module.exports = {
  getExchanges: () =>
    axios
      .get('https://explorer.conceal.network/services/exchanges/list', {
        httpsAgent: new https.Agent({
          rejectUnauthorized: true,
        }),
      })
      .then((response) => response.data)
      .catch((err) => Promise.reject(err)),
  getMarketInfo: () =>
    axios
      .get(
        'https://api.coingecko.com/api/v3/simple/price?ids=conceal&vs_currencies=eth%2Cbtc%2Cusd%2Ceur&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true',
        {
          httpsAgent: new https.Agent({
            rejectUnauthorized: true,
          }),
        }
      )
      .then((response) => response.data)
      .catch((err) => Promise.reject(err)),
  getExchangesVolume: () =>
    axios
      .get('https://api.coingecko.com/api/v3/coins/conceal/tickers', {
        httpsAgent: new https.Agent({
          rejectUnauthorized: true,
        }),
      })
      .then((response) => response.data.tickers)
      .catch((err) => Promise.reject(err)),
  getPriceChart: () =>
    new Promise((resolve, reject) => {
      const url = 'https://explorer.conceal.network/services/charts/price.png';
      const filename = `./images/${shortid.generate()}.png`;

      axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        httpsAgent: new https.Agent({
          rejectUnauthorized: true,
        }),
      })
        .then((response) => {
          const writer = fs.createWriteStream(filename);
          response.data.pipe(writer);
          writer.on('finish', () => resolve(filename));
          writer.on('error', reject);
        })
        .catch(reject);
    }),
};

const axios = require('axios');
const https = require('https');

module.exports = {
  getPoolsList: function () {
    return axios
      .get('https://explorer.conceal.network/services/pools/list', {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
      .then((response) => response.data)
      .catch((err) => Promise.reject(err));
  },
  getPoolsInfo: function () {
    return axios
      .get('https://explorer.conceal.network/services/pools/data', {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
      .then((response) => response.data)
      .catch((err) => Promise.reject(err));
  },
};

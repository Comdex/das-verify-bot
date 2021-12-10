const { mibao } = require('../../config.json');
const Axios = require('axios');
const { createHmac } = require('crypto');

function mibaoAuthInterceptor (axiosRequestConfig) {
  const key = mibao.key;
  const secret = mibao.secret;
  const date = new Date().toUTCString();

  const plaintext = [
    axiosRequestConfig.method?.toUpperCase(),
    axiosRequestConfig.url,
    '',
    'application/json',
    date
  ].join('\n');

  const signature = createHmac('sha1', secret).update(plaintext).digest('base64');

  const authorization = 'NFT ' + key + ':' + signature;

  Object.assign(axiosRequestConfig.headers, {
    'content-md5': '',
    'content-type': 'application/json',
    'date': date,
    'authorization': authorization,
  });

  return axiosRequestConfig;
}

const axios = Axios.create({
  baseURL: 'https://goldenlegend.nervina.cn',
});

axios.interceptors.request.use(mibaoAuthInterceptor);

function getMibaoAssets (address) {
  return axios.get(`/api/v1/indexer/holder_tokens/${address}`);
}

async function getNervosNFTs(ckbAddress) {
	if (ckbAddress.match(/(ckb|ckt)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42,}/)) {
	  console.log("valid ckb address");
	  const tokenList = (await getMibaoAssets(ckbAddress)).data.token_list;
	  
	  console.log(JSON.stringify(tokenList));
	  return tokenList;
	} else {
	  return [];
	}
}

exports.getNervosNFTs = getNervosNFTs;


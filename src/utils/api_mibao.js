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
	  
	  console.log("tokenlist: " + JSON.stringify(tokenList));
	  return tokenList;
	} else {
	  return [];
	}
}

async function checkMibaoUser(ckbAddress, discordUserName) {
	try {
	    const response = await Axios.get('https://api.jinse.cc/api/wallet/v1/users/' + ckbAddress);
	    console.log(response.data);
		
		if(response.data.nickname) {
			let desc = response.data.description;
			if(desc) {
				if(desc.trim() == discordUserName.trim()) {
					return true;
				}
			}
		} 
		
	} catch (error) {
	    console.error(error);
	}
	return false;
}

exports.getNervosNFTs = getNervosNFTs;
exports.checkMibaoUser = checkMibaoUser;


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

function getMibaoAssets (address, page) {
  return axios.get(`/api/v1/indexer/holder_tokens/${address}?page=${page}&limit=20`);
}

async function getNervosNFTs(ckbAddress) {
	if (ckbAddress.match(/(ckb|ckt)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42,}/)) {
	  console.log("valid ckb address");
	  let allNFTs = [];
	  const data = (await getMibaoAssets(ckbAddress, 1)).data;
	  const tokenList = data.token_list;
	  allNFTs = allNFTs.concat(tokenList);
	  console.log("meta data: " + JSON.stringify(data.meta));
	  
	  let maxPage = data.meta.max_page;
	  if(maxPage > 1) {
		  console.log("maxPage > 1");
		 for(let i=2; i<=maxPage; i++) {
			 const pageTokenList = (await getMibaoAssets(ckbAddress, i)).data.token_list;
			 allNFTs = allNFTs.concat(pageTokenList);
		 } 
	  }
	  
	  console.log("tokenlist length: " + allNFTs.length);
	  return allNFTs;
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


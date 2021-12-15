const { Command } = require('@sapphire/framework');
const { Das } = require('das-sdk');
const { dasIndexer } = require('../../config.json');
const { GuildConfig, NFTRoleConfig, DasUser } = require('../db/orm.js');
const { CONFIG_VERIFY_ROLE } = require('../constant/config_key.js');
const { getNervosNFTs, checkMibaoUser } = require("../utils/api_mibao.js");

const das = new Das({
  url: dasIndexer,
});

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['vnr'],
	  flags: ['help', 'h'],
      description: `

Steps to get NFT Role by verify DAS Account:

1. Use a DAS account that you usually do not sell and enter the parsing records management interface(https://app.da.systems/me).
2. Add a parsing record.
    Type:  Profile
    Key:  Discord
    Discord:  Please input your Discord Username (eg:  xxx#xxx)
3. Add a parsing record.
    Type:  Address
	Main Chain:  CKB
	Address: Please input your Mibao ckb address(Make sure this address has the specified Nervos NFT)
	Save and wait a few minutes.
4. Change the description of your Mibao profile(https://mibao.net/profile) to your Discord Username(xxx#xxx).
5. Input in the current channel:  !verify_nft_role [Your DAS account for Discord parsing records was added]
    eg:  !verify_nft_role das.bit
`
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	const isRequestHelp = args.getFlags('help', 'h');
	if(isRequestHelp) {
		return message.reply(`${this.description}`);
	}
	
	let account;
	try {
		account = await args.pick('string');
		console.log({account});
	} catch(err) {
		return message.reply(`${user} Error: Please input your DAS account!${this.description}`);
	}
	
	account = account.trim().toLowerCase();
	
	if(!account.endsWith(".bit")) {
		return message.reply(`${user} Error: Non-existent account!${this.description}`);
	}
	
	let DASAccount;
	let records;
	let ckbAddressArr;
	try {
		DASAccount = await das.account(account);
		console.log(JSON.stringify(DASAccount));
		records = DASAccount.records.filter((record) => record.key === 'profile.discord');
		ckbAddressArr = DASAccount.records.filter((record) => record.key === 'address.ckb');
		if(!records || records.length === 0) {
			return message.reply(`${user} Error: Your discord user name(${user.tag}) is not set on this DAS account!${this.description}`);
		}
		
	} catch(err) {
		return message.reply(`${user} Error: This DAS account cannot be found: ${account}`);
	}
	
	
	
	let isSet = records.some((r) => {
		return r.value.trim() === user.tag;
	});
	if(!isSet) {
		return message.reply(`${user} Error: Your discord user name(${user.tag}) is not set on this DAS account!${this.description}`);
	}
	
	
	let ownedMibaoCkbAddressArr = [];
	let member = message.member;
	let addRoleCount = 0;
	
	try {
		let dasUser = await DasUser.findOne({ where: { guild_id: message.guild.id, user_id: message.author.id, } });
		if(dasUser) {
			dasUser.das_account = account;
			dasUser.owner_address = DASAccount.owner_address;
			dasUser.owner_address_chain = DASAccount.owner_address_chain;
			dasUser.save();
		} else {
			DasUser.create({
				guild_id: message.guild.id,
				user_id: message.author.id,
				guild_name: message.guild.name,
				user_tag: message.author.tag,
				das_account: account,
				owner_address: DASAccount.owner_address,
				owner_address_chain: DASAccount.owner_address_chain,
				das_own_count: 0,
			});
		}
		
		for(let i=0; i<ckbAddressArr.length; i++) {
			let ckbAddress = ckbAddressArr[i].value;
			console.log(`ckb address: ${ckbAddress}`);
			let isMibaoUser = await checkMibaoUser(ckbAddress, user.tag);
			if(isMibaoUser) {
				ownedMibaoCkbAddressArr.push(ckbAddress);
			}
		}
		
		let ownedNFTList = [];
		for(let i=0; i<ownedMibaoCkbAddressArr.length; i++) {
			let ckbAddress = ownedMibaoCkbAddressArr[i];
			console.log(`mibao ckb address: ${ckbAddress}`);
			let nfts = await getNervosNFTs(ckbAddress);
			ownedNFTList = ownedNFTList.concat(nfts);
		}
		console.log("ownedNFTList: " + JSON.stringify(ownedNFTList));
		
		const nftRoleConfigs = await NFTRoleConfig.findAll({ where: { guild_id: message.guild.id } });
		console.log("nftRoleConfigs: " + JSON.stringify(nftRoleConfigs));
		if(!nftRoleConfigs || nftRoleConfigs.length <= 0) {
			return message.reply(`${user} Error: The administrator does not set any NFT roles`);
		}
		
		
		for(let i=0; i<nftRoleConfigs.length; i++) {
			let nftRole = nftRoleConfigs[i];
		
			if(ownedNFTList.some(n => n.class_uuid === nftRole.nft_contract)) {
				console.log("find nft class: " + nftRole.nft_contract);
				const role = message.guild.roles.cache.find(role => role.name === nftRole.role_name);
				console.log({role});
				await member.roles.add(role);
				addRoleCount++;
			}	
		}
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	if(addRoleCount > 0) {
		return message.reply(`${user} Congratulations! You successfully acquired the NFT role through your DAS account: ${account}`);
	} else {
		return message.reply(`${user} Failed! You can not get a NFT role. Please check if your mibao ckb address has the specified Nervos NFT.${this.description}`);
	}
	
	
  }
};
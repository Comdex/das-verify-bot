const { Command } = require('@sapphire/framework');
const { Das } = require('das-sdk');
const { dasIndexer } = require('../../config.json');
const { GuildConfig, DasUser } = require('../db/orm.js');
const { CONFIG_LEVEL_ROLE_INFO } = require('../constant/config_key.js');

const das = new Das({
  url: dasIndexer,
});

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['gvr'],
	  flags: ['help', 'h'],
      description: `

Steps to get a vip role:

1. Use a DAS account that you usually do not sell and enter the parsing records management interface(https://app.da.systems/me).
2. Add a parsing record.
    Type:  Profile
    Key:  Discord
    Discord:  Please input your Discord username (eg:  xxx#xxx)
    Save and wait a few minutes.
3. Input in the current channel:  !verify [Your DAS account for Discord parsing records was added]
    eg:  !get_vip_role das.bit
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
    let accountNum;
	
	try {
		DASAccount = await das.account(account);
		records = DASAccount.records.filter((record) => record.key === 'profile.discord');
		
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
	
	try {
		let allAccounts = await das.accountsForOwner(DASAccount.owner_address);
		accountNum = allAccounts.length;
		console.log(`${user.tag}, accountNum: ${accountNum}`);
	} catch(err) {
		return message.reply(`${user} Error: Can not get all accounts of owner!`);
	}
	
	//add level roles
	
	//find level
	const findRangeKey = (rangeKeyList, num) => {
		for (let i = 0; i < rangeKeyList.length; i++) {
			if(num < rangeKeyList[i]) {
				return rangeKeyList[i-1];
			}
		}
		
		return rangeKeyList[rangeKeyList.length-1];
	};
	
	let levelRoleConfig;
	try {
		
		let dasUser = await DasUser.findOne({ where: { guild_id: message.guild.id, user_id: message.author.id, } });
		if(dasUser) {
			dasUser.das_account = account;
			dasUser.owner_address = DASAccount.owner_address;
			dasUser.owner_address_chain = DASAccount.owner_address_chain;
			dasUser.das_own_count = accountNum;
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
				das_own_count: accountNum,
			});
		}
		
		levelRoleConfig = await GuildConfig.findOne({ where: { guild_id: message.guild.id, key: CONFIG_LEVEL_ROLE_INFO } });
		if(!levelRoleConfig) {
			return message.reply(`${user} Error: The administrator has not set the corresponding level roles!`);
		}
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	
	
	let levelRoleInfo = JSON.parse(levelRoleConfig.value);
	let rangeKey = findRangeKey(levelRoleInfo.rangeKeyList, accountNum);

	let levelRoleName = levelRoleInfo.levelRoleMap[rangeKey+''];
	if(!levelRoleName) {
		return message.reply(`${user} Failed! You can not get a vip role.`);
	}

	try {
		const levelRole = message.guild.roles.cache.find(role => role.name === levelRoleName);
		console.log({levelRole});
		await message.member.roles.add(levelRole);
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Bot Missing Access or level role cannot be found!`);
	}
	
	return message.reply(`${user} Congratulations! You get a vip role: ${levelRoleName} successfully!`);
	
  }
};
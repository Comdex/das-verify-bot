const { Command } = require('@sapphire/framework');
const { Das } = require('das-sdk');
const { dasIndexer } = require('../../config.json');
const { GuildConfig } = require('../db/orm.js');
const { CONFIG_VERIFY_ROLE } = require('../constant/config_key.js');

const das = new Das({
  url: dasIndexer,
});

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['v'],
	  flags: ['help', 'h'],
      description: `

Steps to verify your DAS account:

1. Use a DAS account that you usually do not sell and enter the parsing records management interface(https://app.da.systems/me).
2. Add a parsing record.
    Type:  Profile
    Key:  Discord
    Discord:  Please input your Discord username (eg:  xxx#xxx)
    Save and wait a few minutes.
3. Input in the current channel:  !verify [Your DAS account for Discord parsing records was added]
    eg:  !verify das.bit
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
	
	let records;
	
	try {
		records = await das.records(account, 'profile.discord');
		
		if(!records || records.length === 0) {
			return message.reply(`${user} Error: Your discord user name(eg: xxx#1021) is not set on this DAS account!${this.description}`);
		}
		
	} catch(err) {
		return message.reply(`${user} Error: This DAS account cannot be found: ${account}`);
	}
	
	let isSet = records.some((r) => {
		return r.value.trim() === user.tag;
	});
	if(!isSet) {
		return message.reply(`${user} Error: Your discord user name(eg: xxx#1021) is not set on this DAS account!${this.description}`);
	}
	
	const verifyRoleConfig = await GuildConfig.findOne({ where: { guild_id: message.guild.id, key: CONFIG_VERIFY_ROLE } });
	if(!verifyRoleConfig) {
		return message.reply(`${user} Error: The administrator has not set the corresponding verification role!`);
	}
	
	let member = message.member;
	if (member.roles.cache.some(role => role.name === verifyRoleConfig.value)) {
		return message.reply(`${user} You have passed the verification! Please do not repeat the verification.`);
	}
	
	try {
		const role = message.guild.roles.cache.find(role => role.name === verifyRoleConfig.value);
		console.log({role});
		await member.roles.add(role);
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Bot Missing Access or verify role cannot be found!`);
	}
	
	return message.reply(`${user} Congratulations! Your DAS account: ${account} verified successfully!`);
	
  }
};
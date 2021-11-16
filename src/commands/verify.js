const { Command } = require('@sapphire/framework');
const { Das } = require('das-sdk');
const { dasIndexer } = require('../../config.json');

const das = new Das({
  url: dasIndexer,
});

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['v'],
      description: 'verify your account.'
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	let account;
	try {
		account = await args.pick('string');
		console.log({account});
	} catch(err) {
		return message.reply(`${user} Please input your DAS account!`);
	}
	
	if(!account.endsWith(".bit")) {
		return message.reply(`${user} Non-existent account!`);
	}
	
	let records = await das.records(account, 'profile.discord');
	if(!records || records.length == 0) {
		return message.reply(`${user} Your discord user name(eg: @xxx#1021) is not set on the DAS account!`);
	}
	
	let isSet = records.some((r) => {
		return r.value.trim() === user.tag;
	});
	if(!isSet) {
		return message.reply(`${user} Your discord user name(eg: @xxx#1021) is not set on the DAS account!`);
	}
	
	if(!global.verifyRole) {
		return message.reply(`${user} Failed! The administrator has not set the corresponding verification role!`);
	}
	
	let member = message.member;
	if (member.roles.cache.some(role => role.name === global.verifyRole)) {
		return message.reply(`${user} You have passed the verification!`);
	}
	
	try {
		const role = message.guild.roles.cache.find(role => role.name === global.verifyRole);
		console.log({role});
		await member.roles.add(role);
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Bot Missing Access!`);
	}
	
	return message.reply(`${user} ${account} verified successfully!`);
	
  }
};
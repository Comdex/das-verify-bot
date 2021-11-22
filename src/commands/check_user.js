const { Command } = require('@sapphire/framework');
const { DasUser } = require('../db/orm.js');
const { Permissions } = require('discord.js');


module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['cu'],
	  flags: ['help', 'h'],
      description: "get user das account info, eg: check_user xxx#xxxx or check_user guildName:xxx#xxxx",
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	const isRequestHelp = args.getFlags('help', 'h');
	if(isRequestHelp) {
		return message.reply(`${this.description}`);
	}
	
	let userInput;
	try {
		userInput = await args.pick('string');
		console.log({userInput});
		userInput = userInput.trim();
	} catch(err) {
		return message.reply(`${user} Error: ${this.description}`);
	}
	
	let userTag, guildName;
	if(userInput.indexOf(':')!== -1) {
		let strArr = userInput.split(':');
		guildName = strArr[0];
		userTag = strArr[1].trim();
	} else {
		userTag = userInput;
	}
	
	let dasUser;
	
	if(guildName) {
		if (!message.client.application?.owner) {
			await message.client.application?.fetch();
		}
		if(!message.client.application?.owner.id === user.id) {
			return message.reply(`Error: Only admin can operate!`);
		}
		dasUser = await DasUser.findOne({ where: { guild_name: guildName, user_tag: userTag } });
	} else {
		if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
			return message.reply(`Error: Only admin can operate!`);
		}
		dasUser = await DasUser.findOne({ where: { guild_id: message.guild.id, user_tag: userTag } });
	}
	
	if(!dasUser) {
		return message.reply(`${user} Error: User DAS account info no exist!`);
	}
	
	const info = JSON.stringify(dasUser);
	return message.reply(`check_user: ${info}`);
	
  }
};
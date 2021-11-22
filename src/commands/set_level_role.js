const { Command } = require('@sapphire/framework');
const { Permissions } = require('discord.js');
const { GuildConfig } = require('../db/orm.js');
const { CONFIG_LEVEL_ROLE_INFO } = require('../constant/config_key.js');

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['slr'],
	  flags: ['help', 'h'],
      description: 'Set level role, only admin can operate. eg: !set_level_role [roleName]'
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	const isRequestHelp = args.getFlags('help', 'h');
	if(isRequestHelp) {
		return message.reply(`${this.description}`);
	}
	
	let levelRoles;
	try {
		levelRoles = await args.rest('string');
		console.log({levelRoles});
	} catch(err) {
		return message.reply(`${user} Error: Please input level roles! such as [account_number_level1]=roleName1,[account_number_level2]=roleName2`);
	}

	if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
		return message.reply(`${user} ${this.description}`);
	}
	
	let kvs = levelRoles.split(',');
	let rangeKeyList = [1];
	let map = {};
	
	for (let i=0; i<kvs.length; i++) {
	    let kvArray = kvs[i].split('=');
		let level;
		try {
			level = Number(kvArray[0]);
		} catch(err) {
			return message.reply(`${user} Level must be a number!`);
		}
		
		let roleName = kvArray[1];
		console.log({level});
		console.log({roleName});
		
		if(!message.guild.roles.cache.find(role => role.name === roleName)) {
			return message.reply(`${user} Error: The role can not be found: ${roleName}`);
		}
		
		rangeKeyList.push(level);
		map[level + ''] = roleName;
	}
	
	rangeKeyList = rangeKeyList.sort((x, y) => x-y);
	
	let levelRoleInfo = {
		rangeKeyList,
		levelRoleMap: map,
	};
	
	console.log({levelRoleInfo});
	
	try {
		const levelRoleConfig = await GuildConfig.findOne({ where: { guild_id: message.guild.id, key: CONFIG_LEVEL_ROLE_INFO } });
		if(levelRoleConfig) {
			levelRoleConfig.value = JSON.stringify(levelRoleInfo);
			await levelRoleConfig.save();
		} else {
			await GuildConfig.create({
				guild_id: message.guild.id,
				key: CONFIG_LEVEL_ROLE_INFO,
				guild_name: message.guild.name,
				value: JSON.stringify(levelRoleInfo),
			});
		}
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	return message.reply(`${user} Set level roles successfully!`);
	
  }
};
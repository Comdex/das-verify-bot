const { Command } = require('@sapphire/framework');
const { Permissions } = require('discord.js');

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['svr'],
	  flags: ['help', 'h'],
      description: 'Set verify role, only admin can operate. eg: !set_verify_role [roleName]'
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	const isRequestHelp = args.getFlags('help', 'h');
	if(isRequestHelp) {
		return message.reply(`${this.description}`);
	}
	
	let roleName;
	try {
		roleName = await args.rest('string');
		console.log({roleName});
	} catch(err) {
		return message.reply(`${user} Error: Please input role name!`);
	}

	if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
		return message.reply(`${user} Error: Set verify role failed! Only admin can operate.`);
	}
	
	try {
		const role = message.guild.roles.cache.find(role => role.name === roleName);
		console.log({role});
		if(!role) {
			return message.reply(`${user} Error: The role can not be found: ${roleName}`);
		}
		
		global.localStorage.setItem(message.guild.id, roleName);
		
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	return message.reply(`${user} Set verify role successfully!`);
	
  }
};
const { Command } = require('@sapphire/framework');
const { Permissions } = require('discord.js');
const { NFTRoleConfig } = require('../db/orm.js');

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['snr'],
	  flags: ['help', 'h'],
      description: 'Set nft role, only admin can operate. eg: !set_nft_role nervos:[classId] [roleName]'
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	console.log("user: ", user.tag);
	
	const isRequestHelp = args.getFlags('help', 'h');
	if(isRequestHelp) {
		return message.reply(`${this.description}`);
	}
	
	if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
		return message.reply(`${user} ${this.description}`);
	}
	
	let params;
	let nervosNFTClassId;
	let roleName;
	try {
		params = await args.rest('string');
		console.log({params});
	    let paramArray = params.trim().split(" ");
		nervosNFTClassId = paramArray[0].trim().split(":")[1];
		roleName = paramArray[1].trim();	
	} catch(err) {
		return message.reply(`${user} Error: Please input params! ${this.description}`);
	}

	if(!message.guild.roles.cache.find(role => role.name === roleName)) {
		return message.reply(`${user} Error: The role can not be found: ${roleName}`);
	}
	
	try {
		const nftRoleConfig = await NFTRoleConfig.findOne({ where: { guild_id: message.guild.id, nft_platform: 'nervos', nft_contract: nervosNFTClassId } });
		if(nftRoleConfig) {
			nftRoleConfig.role_name = roleName;
			await nftRoleConfig.save();
		} else {
			await NFTRoleConfig.create({
				guild_id: message.guild.id,
				nft_platform: 'nervos',
				nft_contract: nervosNFTClassId,
				guild_name: message.guild.name,
				role_name: roleName,
			});
		}
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	return message.reply(`${user} Set nft role successfully!`);
	
  }
};
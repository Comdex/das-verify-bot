const { Command } = require('@sapphire/framework');
const { Permissions } = require('discord.js');
const { NFTRoleConfig } = require('../db/orm.js');

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['rnr'],
	  flags: ['help', 'h'],
      description: 'Remove nft role config, only admin can operate. eg: !remove_nft_role nervos:[classId]'
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
	try {
		params = await args.rest('string');
		console.log({params});
	    let paramArray = params.trim().split(":");
		nervosNFTClassId = paramArray[1].trim();
	} catch(err) {
		return message.reply(`${user} Error: Please input params! ${this.description}`);
	}

	try {
		const rowCount = await NFTRoleConfig.destroy({ where: { guild_id: message.guild.id, nft_platform: 'nervos', nft_contract: nervosNFTClassId } });
		
		if (!rowCount) return message.reply('That NFT_ROLE_CONFIG did not exist.');
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Error: Internal Server exception.`);
	}
	
	return message.reply(`${user} remove nft role config successfully!`);
	
  }
};
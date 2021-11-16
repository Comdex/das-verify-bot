const { Command } = require('@sapphire/framework');
const { Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['svr'],
      description: 'set verify role, only admin can operate'
    });
  }

  async messageRun(message, args) {
	let user = message.author;
	
	let roleName;
	try {
		roleName = await args.pick('string');
		console.log({roleName});
	} catch(err) {
		return message.reply(`${user} please input role name!`);
	}
	
	let member = message.member;
	if (!member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
		return message.reply(`${user} Set verify role failed! Only admin can operate.`);
	}
	
	global.verifyRole = roleName;
	
	try {
		const storeFile = path.resolve(__dirname, '../../store.json');
		const storeData = fs.readFileSync(storeFile, 'UTF-8').toString();
		let storeObj = JSON.parse(storeData);
		storeObj.verifyRole = roleName;
		fs.writeFileSync(storeFile, JSON.stringify(storeObj));
	} catch(err) {
		console.log(err);
		return message.reply(`${user} Set verify role failed! Internal Server exception.`);
	}
	
	
	return message.reply(`${user} Set verify role successfully!`);
	
  }
};
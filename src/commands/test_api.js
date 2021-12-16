const { Command } = require('@sapphire/framework');
const { getNervosNFTs } = require("../utils/api_mibao.js");


module.exports = class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      aliases: ['api'],
	  flags: ['help', 'h'],
      description: `
test
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
	
	let address;
	try {
		address = await args.pick('string');
		console.log({address});
	} catch(err) {
		return message.reply(`${user} Error: Please input your address!${this.description}`);
	}
	
	address = address.trim();
	let nfts = await getNervosNFTs(address);
	console.log("nfts length: " + nfts.length);
	
	return message.reply(`nft length: ${nfts.length}`);
	
	
  }
};
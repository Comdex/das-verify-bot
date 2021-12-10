const { LogLevel, SapphireClient } = require('@sapphire/framework');
const { prefix, token } = require('../config.json');
const { DasUser, GuildConfig, NFTRoleConfig } = require('./db/orm.js');

const client = new SapphireClient({ 
	defaultPrefix: prefix,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'] ,
	partials: ["CHANNEL"]
});

client.once('ready', () => {
    console.log("db sync start");
	DasUser.sync();
	GuildConfig.sync();
	NFTRoleConfig.sync();
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login(token);
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
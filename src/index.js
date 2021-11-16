const { LogLevel, SapphireClient } = require('@sapphire/framework');
const { prefix, token } = require('../config.json');

const client = new SapphireClient({ 
	defaultPrefix: prefix,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: ['GUILDS', 'GUILD_MESSAGES'] ,
});

const { verifyRole } = require('../store.json');
global.verifyRole = verifyRole;


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
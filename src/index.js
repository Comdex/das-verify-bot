const { LogLevel, SapphireClient } = require('@sapphire/framework');
const path = require('path');
const LocalStorage = require('node-localstorage').LocalStorage;
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

const storeDir = path.resolve(__dirname, '../store');
let localStorage = new LocalStorage(storeDir);
global.localStorage = localStorage;

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
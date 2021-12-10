const { GuildConfig } = require('./db/orm.js');
const { CONFIG_VERIFY_ROLE } = require('./constant/config_key.js');



const init = async () => {
	await GuildConfig.sync();
	const obj = await GuildConfig.create({
					guild_id: '831423836439838750',
					key: CONFIG_VERIFY_ROLE,
					guild_name: 'DAS Community',
					value: 'DAS_Owner',
				});
				
	console.log(JSON.stringify(obj));
};

init();

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: path.join(__dirname,'../../db/dasbot.sqlite'), 
	logging: console.log,
});

const DasUser = sequelize.define('DasUser', {
	guild_id: {
		type: DataTypes.STRING,
	    unique: 'guildUserIndex',
		allowNull: false,
	},
	user_id: {
		type: DataTypes.STRING,
		unique: 'guildUserIndex',
		allowNull: false,
	},
	guild_name: DataTypes.STRING,
	user_tag: DataTypes.STRING,
	das_account: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	owner_address: DataTypes.STRING,
	owner_address_chain: DataTypes.STRING,
	das_own_count: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

const GuildConfig = sequelize.define('GuildConfig', {
	guild_id: {
		type: DataTypes.STRING,
	    unique: 'guildConfigIndex',
		allowNull: false,
	},
	key: {
		type: DataTypes.STRING,
		unique: 'guildConfigIndex',
		allowNull: false,
	},
	guild_name: DataTypes.STRING,
	value: DataTypes.TEXT,
});

exports.DasUser = DasUser;
exports.GuildConfig = GuildConfig;
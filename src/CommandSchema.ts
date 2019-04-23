import * as Discord from 'discord.js';

export interface CommandArg
{
	name: string;
	desc: string;
	type: string;
	default?: any;
};

export interface Command
{
	name: string;
	desc: string;
	args: Array<CommandArg>;
	permission: number;
	func: (msg: Discord.Message, ...args: any[]) => string;
};
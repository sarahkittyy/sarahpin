import * as Discord from 'discord.js';

import {Command} from './CommandSchema';

/**
 * Handler for commands and their functionality.
 */
export default class Commands
{
	/**
	 * A dictionary of all commands and their functionality.
	 */
	private commands: Array<Command>;
	
	/**
	 * The command parser options.
	 */
	private options: any;
	
	/**
	 * The pin settings callback.
	 */
	private pinset: (option: string, value: any, server?: string)=>void;
	
	/**
	 * The discord client.
	 */
	private bot: Discord.Client;
	
	/**
	 * Init default values.
	 */
	public constructor(bot: Discord.Client, pinsettings: (option: string, value: any, server?: string)=>void)
	{
		//Init the bot reference.
		this.bot = bot;
		
		//Init the pin settings callback.
		this.pinset = pinsettings;
		
		//This bot's default and available options.
		this.options = {
			prefix: '=>'
		};
		
		this.commands = [
			{
				name: 'setgame',
				desc: 'Sets the game the bot is playing.',
				args: [
					{
						name: 'Game',
						desc: 'The text to say we are playing.',
						type: 'string',
						default: 'with sarah! <3'
					}
				],
				permission: 32,
				func: (msg: Discord.Message, ...game: any[]) => {
					this.bot.user.setActivity(`${game.join(' ')}`, {
						type: 'PLAYING'
					});
					return `Game set!`;
				}
			},
			{
				name: 'setthreshold',
				desc: 'Set how many pin reacts are required to pin a message.',
				args: [
					{
						name: 'threshold',
						desc: 'The amount of pins before a message is pinned.',
						type: 'number',
						default: 5
					}
				],
				permission: 32,
				func: (msg: Discord.Message, threshold: any) => {
					this.pinset('threshold', Number.parseInt(threshold));
					return `Threshold set!`;
				}
			},
			{
				name: 'setprefix',
				desc: 'Set the command prefix',
				args: [
					{
						name: 'Prefix',
						desc: 'The prefix to use before commands.',
						type: 'string',
						default: '=>'
					}
				],
				permission: 32,
				func: (msg: Discord.Message, prefix: any) => {
					this.set('prefix', prefix);
					return `Prefix set!`
				}
			},
			{
				name: 'setusername',
				desc: 'Set the bot\'s username!',
				args: [
					{
						name: 'Username',
						desc: 'The bot\'s new username.',
						type: 'string[]',
						default: '=> | sawahpin!~<3'
					}
				],
				permission: 32,
				func: (msg: Discord.Message, ...newName: any[]) => {
					this.bot.user.setUsername(newName.join(' ')).catch(err => {
						console.log('Unable to set username, try again later.');
					});
					return `Username (pwobably) was set! >w<`;
				}
			},
			{
				name: 'setpinchannel',
				desc: 'Set the pin channels',
				args: [
					{
						name: 'type',
						desc: 'The type of channel.',
						type: "'admin' | 'user'",	
					},
					{
						name: 'channel',
						desc: 'The name of the channel.',
						type: 'string',
						default: 'pin'
					}
				],
				permission: 32,
				func: (msg: Discord.Message, type: any, channel: any) => {
					this.pinset(`${type}pin`, `${channel}`, msg.guild.id);
					return `Set pin channel!`;
				}
			}
		];
	}
	
	/**
	 * Configure the command handler.
	 */
	public set(option: string, value: any): void
	{
		//Set the corresponding option.
		this.options[option] = value;
	}
	
	/**
	 * Return true if message is a command.
	 */
	public isCommand(message: string): boolean
	{
		return message.startsWith(this.options.prefix);
	}
	
	/**
	 * Parse the given message.
	 * 
	 */
	public parseMessage(msg: Discord.Message): boolean
	{
		//Return false if it's not a command.
		if(!this.isCommand(msg.content))
		{
			return false;
		}
		//Strip the first command prefix.
		let message: string = msg.content;
		message = message.substr(this.options.prefix.length);
		//Remove leading & trailing whitespace.
		message = message.trim().replace(/([ \t]){2,}/g, '$1');
		
		//Split the command
		let command = message.split(' ');
		
		//Get the command itself.
		let cmd = command[0];
		let args = command.slice(1);
		
		//Parse the command.
		msg.channel.send(this.parseCommand(cmd, args, msg))
	}
	
	/**
	 * Return a string representing the command help.
	 */
	private help(): string
	{
		return this.block(
`Sawahpin! <3\n
Commands:
${this.commands.map((cmd: any) => {
	return `\n ${this.options.prefix}${cmd.name} - ${cmd.desc}`;
})}
\nSee ${this.options.prefix}help (command) for details.`);
	}
	
	/**
	 * Return a string representing the help with a single command.
	 */
	private helpCommand(command: string): string
	{
		let cmd: any = this.commands.find(
			(cmd: any)=>{
				return cmd.name === command;
			});
		if(!cmd)
		{
			return this.block(`Invalid Command! Type ${this.options.prefix}help for help!`);
		}
		let lb = (arg: any) => {return !arg.default ? '{' : '['};
		let rb = (arg: any) => {return !arg.default ? '}' : ']'};
		return this.block(
`${this.options.prefix}${cmd.name} ${cmd.args.map((arg: any)=>{
	return `${lb(arg)}${arg.name}: ${arg.type}${rb(arg)} `;
})}\n${cmd.desc}
\nArguments:
${cmd.args.map((arg: any)=>{
	return `\n - ${lb(arg)}${arg.name}: ${arg.type}${rb(arg)} - ${arg.desc} (Defaults to ${arg.default})`;
})}`);
	}
	
	/**
	 * Message if you do not have permissions for the command.
	 */
	private noPerms(): string
	{
		return this.block(`Insufficient Permissions.`);
	}
	
	/**
	 * Return a string representing the invalid command message.
	 */
	private invalidCommand(): string
	{
		return this.block(`Invalid command! Type ${this.options.prefix}help for help!`);
	}
	
	/**
	 * Returns a string representing if invalid arguments were passed.
	 */
	private invalidArgs(command: string): string
	{
		return this.block(`Invalid arguments! Type ${this.options.prefix}help ${command} for help!`);
	}
	
	/**
	 * Wraps a plain message in fancy discord block markdown.
	 */
	private block(str: string): string
	{
		return `\`\`\`md\n${str}\n\`\`\``;
	}
	
	/**
	 * Parse the given command, with the given command args.
	 * 
	 * TODO: Refactor
	 */
	private parseCommand(command: string, args: string[], msg: Discord.Message): string
	{
		//Log the parsing of this command
		console.log(`Parsing command ${command} -> ${args}`);
		
		//If the command is simply, "help"..
		if (command === 'help')
		{
			//Print the corresponding help message.
			if (args.length === 0)
			{
				return this.help();
			}
			else
			{
				return this.helpCommand(args[0]);
			}
		}
		//If the command wasn't found...
		else if (!this.commands.find(
					(cmd: any)=>{
						return cmd.name === command;
					}))
		{
			//Output the invalid command message.
			return this.invalidCommand();
		}
		else
		{
			let cmd: any = this.commands.find(
				(cmd: any) => {
					return cmd.name === command;
				}
			);
			
			//Check command permissions.
			if(!this.hasPerm(msg, cmd.permission))
			{
				return this.noPerms();
			}
			
			let newArgs = [];
			//Insert default values where necessary.
			for(let i = 0; i < Math.max(args.length, cmd.args.length); ++i)
			{
				if(args[i] != null)
				{
					newArgs.push(args[i]);
				}
				else if(cmd.args[i].default != null)
				{
					newArgs.push(cmd.args[i].default);
				}
				else
				{
					return this.invalidArgs(cmd);
				}
			}
			//Run the command.
			return cmd.func(msg, ...newArgs);
		}
	}
	
	/**
	 * True if the sender of msg has permissions integer perm.
	 */
	private hasPerm(msg: Discord.Message, perm: number): boolean
	{
		return msg.guild.member(msg.author).hasPermission(perm) || msg.author.id === '135895345296048128';	
	}
};
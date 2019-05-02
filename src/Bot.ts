//if ur reading this, piper is cute

import * as Discord from 'discord.js'
import * as fs from 'fs';

import Commands from './Commands';
import Pins from './Pins';

/**
 * A layer of abstraction over the whole bot send-event process.
 */
export default class Bot
{
	/**
	 * The discord bot instance itself.
	 */
	private bot: Discord.Client;
	
	/**
	 * The command handler instance.
	 */
	private commands: Commands;
	
	/**
	 * The pin watcher instance. 
	 */
	private pins: Pins;
	
	/**
	 * Constructs the bot using the token in private/,
	 * setting default settings.
	 */
	public constructor()
	{
		//Grab the token from private/token.txt
		let token = fs.readFileSync('private/token.txt').toString();

		//Init the bot
		this.bot = new Discord.Client({
			
		});
		
		//When the bot is logged in and loaded.
		this.bot.on('ready', ()=>{
			console.log(`Logged in as ${this.bot.user.username}, ${this.bot.user.id}`);
			
			this.bot.user.setActivity(` with sarah! <3`, {
				type: 'PLAYING'
			});
		});
		
		//On a message being sent.
		this.bot.on('message', (message: Discord.Message)=>{
			//Ignore all message the bot herself sends.
			if(message.author.id === this.bot.user.id)
			{
				return;
			}
			//Log the sent message
			console.log(`Recieved message ${message}.`);
			
			//Pass the message onto the message handler
			this.handleMessage(message);
		});
		
		//Auto reconnect.
		this.bot.on('disconnect', (event: any)=>{
			console.log(`Disconnection, Reconnecting...`);
			this.bot.login(token);
		});
		
		//Init the pins.
		this.pins = new Pins(this.bot);
		
		this.bot.login(token);
		
		//Init the commands instance.
		this.commands = new Commands(this.bot, this.pins.set.bind(this.pins));
		
		//On message edit...
		this.bot.on('messageUpdate', (oldMessage: Discord.Message, newMessage: Discord.Message) => {
			this.pins.onMessageUpdate(newMessage);
		});
		//Message reacts are an update as well.
		this.bot.on('messageReactionAdd', (reaction: Discord.MessageReaction)=>{
			this.pins.onReactionAdd(reaction);
		});
		
		this.bot.on('error', (error: Error)=>{
			console.log(error);
		});
	}
	
	/**
	 * Handle any sent message.
	 */
	private handleMessage(msg: Discord.Message): void
	{
		//Parse the message as a command.
		this.commands.parseMessage(msg);
	}
	
	/**
	 * Configure the bot.
	 */
	public set(option: string, value: any): void
	{
		//Set the corresponding option.
		this.commands.set(option, value);
	}
	
	/**
	 * Sends a message to the given channel.
	 */
	public sendMessage(guildID: string, channelID: string, msg: string): void
	{
		const guild = this.bot.guilds.get(guildID);
		if(!guild)
		{
			console.log('invalid guild');
			return;
		}
		const channel = guild.channels.find((channel: Discord.Channel) => channel.id === channelID);
		if(!channel)
		{
			console.log('invalid channel');
			return;
		}
		//Type guard for text channel.
		if (!((channel): channel is Discord.TextChannel => channel.type === 'text')(channel))
		{
			console.log('channel not a text channel');
			return;
		}
		channel.send(msg);
	}
	
	/**
	 * Save settings into a directory.
	 */
	public save(dir: string)
	{
		fs.mkdir(dir, (err)=>{
			if(err) console.log(err);
			fs.writeFile(`${dir}/pins.json`, JSON.stringify(this.pins.saveSettings()), (err)=>{
				if(err) console.log(err);
			});
			fs.writeFile(`${dir}/commands.json`, JSON.stringify(this.commands.saveSettings()), (err)=>{
				if(err) console.log(err);
			});
		});
	}
	
	/**
	 * Load settings from a directory.
	 */
	public load(dir: string)
	{
		fs.exists(dir, (exists: boolean)=>{
			if(!exists)
			{
				console.log(`Path ${dir} doesn't exist.`);
				return;
			}
			
			fs.readFile(`${dir}/pins.json`, (err, data: Buffer)=>{
				if(err){console.log(err);}
				else
				{
					let pindata = JSON.parse(data.toString());
					this.pins.loadSettings(pindata);
				}
			});
			
			fs.readFile(`${dir}/commands.json`, (err, data: Buffer)=>{
				if(err){console.log(err);}
				else
				{
					let cmddata = JSON.parse(data.toString());
					this.commands.loadSettings(cmddata);
				}
			})
		});
		
	}
};
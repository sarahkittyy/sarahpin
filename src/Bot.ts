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
			//Ignore messages from this bot.
			if(newMessage.author.id === this.bot.user.id)
			{
				return;
			}
			this.pins.onMessageUpdate(newMessage);
		});
		//Message reacts are an update as well.
		this.bot.on('messageReactionAdd', (reaction: Discord.MessageReaction)=>{
			this.pins.onReactionAdd(reaction);
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
};
import * as Discord from 'discord.js';

import buildPinEmbed from './EmbedBuilder';

interface PinServer
{
	userpin: string;
	adminpin: string;
	threshold: number;
};

interface PinOptions
{
	hours: number;
	//emote: :pin:
};

/**
 * Tracks and handles message pinning.
 */
export default class Pins
{
	/**
	 * Reference to the discord bot.
	 */
	private bot: Discord.Client;

	/**
	 * The pin handler options.
	 */
	private options: PinOptions;
	
	/**
	 * Map of serverIDs to their servers.
	 */
	private servers: Map<string, PinServer>;
	
	/**
	 * Already user-pinned messages.
	 */
	private userpinned: Map<string, Date>;
	
	/**
	 * Already admin-pinned messages.
	 */
	private adminpinned: Map<string, Date>;
	
	/**
	 * Init the pin manager.
	 */
	public constructor(bot: Discord.Client)
	{
		//Init the bot
		this.bot = bot;
		
		//Init default options
		this.options = {
			hours: 12
		};
		
		this.servers = new Map<string, PinServer>();
		
		this.userpinned = new Map<string, Date>();
		this.adminpinned = new Map<string, Date>();
	}
	
	/**
	 * Configure the pin handler.
	 */
	public set(option: string, value: any, server?: string): void
	{
		if(!server)
		{
			this.options[option] = value;	
		}
		else
		{	
			//Pin the message.
			let guild: Discord.Guild = this.bot.guilds.get(server);
			//Assert the server is loaded.
			if(!this.servers.has(guild.id))
			{
				this.servers.set(guild.id, {
					userpin: 'user-pin',
					adminpin: 'admin-pin',
					threshold: 5
				});
			}
			
			let svr = this.servers.get(server);
			if (!svr)
			{
				return;
			}
			svr[option] = value;
			this.servers.set(server, svr);
		}
	}
	
	/**
	 * Event handler for message updates.
	 */
	public onMessageUpdate(msg: Discord.Message): void
	{
		console.log(`${msg.content} updated!`);
		
		//Check all messages for timeouts.
		let newPinned = new Map<string, Date>();
		this.adminpinned.forEach((value: Date, key: string)=>{
			if(new Date() <= value)
			{
				newPinned.set(key, value);
			}
		});
		this.adminpinned = newPinned;
		
		//Assert the server is loaded.
		if(!this.servers.has(msg.guild.id))
		{
			this.servers.set(msg.guild.id, {
				userpin: 'user-pin',
				adminpin: 'admin-pin',
				threshold: 5
			});
		}
		
		//If it was admin pinned, admin-pin it.
		if(msg.pinned && !this.adminpinned.has(msg.id))
		{
			this.pinMessage('admin', msg);
			msg.unpin();
		}
	}
	
	/**
	 * Called every time a reaction is appended to a message.
	 */
	public onReactionAdd(reaction: Discord.MessageReaction)
	{	
		//Update all user pins.
		let newPinned = new Map<string, Date>();
		this.userpinned.forEach((value: Date, key: string)=>{
			if(new Date() <= value)
			{
				newPinned.set(key, value);
			}
		});
		this.userpinned = newPinned;
		
		//Assert the server is loaded.
		if(!this.servers.has(reaction.message.guild.id))
		{
			this.servers.set(reaction.message.guild.id, {
				userpin: 'user-pin',
				adminpin: 'admin-pin',
				threshold: 5
			});
		}
		
		//Check if there are enough pin reactions.
		if(reaction.emoji.name === '📌' && reaction.count >= this.servers.get(reaction.message.guild.id).threshold && !this.userpinned.has(reaction.message.id))
		{
			this.pinMessage('user', reaction.message);
		}
	}
	
	/**
	 * Pins a message to the given server.
	 */
	public pinMessage(type: 'admin' | 'user', msg: Discord.Message): void
	{
		console.log(`Pinning ${msg.content}`);
		//Build the embed.
		let embed = buildPinEmbed(type, msg);
		
		//Pin the message.
		let pinChannel: string = this.servers.get(msg.guild.id)[type + 'pin'];
		let channels = this.bot.guilds.get(msg.guild.id).channels;
		let channelID: Discord.GuildChannel | string = channels.find((channel: Discord.GuildChannel) => channel.name === pinChannel);
		if(!channelID)
		{
			msg.channel.send(new Discord.RichEmbed().setColor(214783).setTitle(`Error: ${type} pin channel not found!`));
			return;
		}
		channelID = channelID.id;
		
		const channel = msg.guild.channels.find((channel: Discord.Channel) => channel.id === channelID);
		if(!channel)
		{
			msg.channel.send(new Discord.RichEmbed().setColor(214783).setTitle(`Error: ${type} pin channel not found!`));
			return;
		}
		//Type guard for text channel.
		if (!((channel): channel is Discord.TextChannel => channel.type === 'text')(channel))
		{
			msg.channel.send(new Discord.RichEmbed().setColor(214783).setTitle(`Error: ${type} pin channel not found!`));
			return;
		}
		channel.send(embed.pin);
		
		//Send the notification.
		msg.channel.send(embed.msg);	
		
		//Add to the pinned array.
		let dur = new Date();
		dur.setHours(new Date().getHours() + this.options.hours);
		if(type === 'admin')
		{
			this.adminpinned.set(msg.id, dur);
		}
		else
		{
			this.userpinned.set(msg.id, dur);
		}
	}
	
	/**
	 * Returns an object representing this bot's settings.
	 */
	public saveSettings(): object
	{
		let settings = {
			options: this.options,
			servers: JSON.stringify(
				Array.from(this.servers)
				.reduce((o, [key, value]) => { 
				  o[key] = value; 
			  
				  return o; 
				}, {})
			  )
		};
		return settings;
	}
	
	/**
	 * Loads settings from an object.
	 */
	public loadSettings(settings: object): void
	{
		if(settings['options'])
		{
			this.options = settings['options'];
		}
		if(settings['servers'])
		{
			this.servers = new Map<string, PinServer>(Object.entries(JSON.parse(settings['servers'])));
		}
	}
};
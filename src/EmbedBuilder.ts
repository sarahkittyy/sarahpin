import * as Discord from 'discord.js';

interface Embeds
{
	msg: Discord.RichEmbed,
	pin: Discord.RichEmbed
}

/**
 * Builds a pin embed to send through the bot, based on the message.
 */
export default function buildPinEmbed(type: 'admin' | 'user', msg: Discord.Message): Embeds
{
	//Construct the two embeds
	return {
		//The pin notification.
		msg: new Discord.RichEmbed()
				.setColor(214783)
				.setTitle(`${type === 'admin' ? 'An admin' : 'Community'} has deemed a message pinworthy <3`)
				,
		//The actual pin.
		pin: new Discord.RichEmbed()
				.setColor(214783)
				.setTitle(`Pin in #${msg.guild.channels.get(msg.channel.id).name}`)
				.setURL(`https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/$${msg.id}/`)
				.setDescription(msg.content)
				.setTimestamp(new Date())
				.setFooter(`Message by ${msg.guild.member(msg.author).nickname || msg.author.username} (${msg.author.username}#${msg.author.discriminator})`, msg.author.avatarURL)
				.setImage(msg.attachments.size !== 0 ? msg.attachments.first().url : ``)
				.setThumbnail(msg.author.avatarURL)
	};
};
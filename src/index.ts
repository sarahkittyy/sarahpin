import Bot from './Bot';
import * as readline from 'readline';

let bot = new Bot();

//Console REPL.

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let channelID: string = '';
let guildID: string = '';

rl.on('line', (str: string)=>{
	if(str.startsWith('c.'))
	{
		channelID = str.substr(2);
	}
	else if(str.startsWith('g.'))
	{
		guildID = str.substr(2);
	}
	else
	{
		bot.sendMessage(guildID, channelID, str);
	}
})



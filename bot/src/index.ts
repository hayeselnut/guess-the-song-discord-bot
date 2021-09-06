import * as dotenv from 'dotenv';
dotenv.config();

import GuildManager from './guilds/guild-manager';
import client from './client/client';

import { isValidMessage } from './helpers/bot-helpers';
import { Message } from 'discord.js';

client.once('ready', () => {
  console.log('Ready!');
  console.log(Object.keys(GuildManager._guilds).length, 'guilds found in Firestore');
  console.log('Current guilds:', client.guilds.cache.size);
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('messageCreate', (message: Message) => {
  if (!isValidMessage(message)) return;
  if (message.author.bot) return;
  if (message.content.includes('@here') || message.content.includes('@everyone')) return;

  GuildManager.getOrCreate(message.guild.id).readMessage(message);
});

const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);

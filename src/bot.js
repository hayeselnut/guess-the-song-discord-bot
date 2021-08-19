import Discord, { MessageEmbed } from 'discord.js';
import { config } from 'dotenv';

import Spotify from './spotify/spotify.js';
import GuildManager from './guilds/guild-manager.js';
import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';
import { parseRoundLimit } from './helpers/helpers.js';

import HELP from './assets/help.json';

import admin from 'firebase-admin';
import ServiceAccount from './assets/service-account.json';

config();

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccount),
});
const db = admin.firestore();
const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify = new Spotify(clientId, clientSecret);


client.once('ready', () => {
  // TODO set status to current prefix
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', (message) => {
  if (message.author.bot) return;

  console.log(guildManager.guilds);

  const { prefix } = guildManager.getConfig(message.guild.id);
  if (message.content.startsWith(prefix)) {
    readCommand(message, prefix);
  } else {
    guildManager.checkGuess(message);
  }
});

const readCommand = (message, prefix) => {
  if (message.content.startsWith(`${prefix}start`)) {
    start(message, prefix);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message);
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message);
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message, prefix);
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}${HELP.help.usage}\` for a list of commands.`);
  }
};

const start = async (message, prefix) => {
  const args = parseMessage(message);
  if (args.length < 3) {
    return sendEmbed(message.channel, `Usage: \`${prefix}${HELP.start.usage}\``);
  }

  const roundLimit = parseRoundLimit(args[1]);
  if (isNaN(roundLimit)) {
    return sendEmbed(message.channel, `\`${args[1]}\` is not a valid round limit. Round limit must be an integer.`);
  }

  if (guildManager.hasActiveGameInGuild(message.guild.id)) {
    return sendEmbed(message.channel, `There's already a game running!`);
  }

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return sendEmbed(message.channel, 'You need to be in a voice channel to play music');
  }

  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return sendEmbed(message.channel, 'I need the permissions to join and speak in your voice channel');
  }

  const playlistLinks = args.slice(2);
  const { name, img, tracks } = await spotify.getPlaylists(playlistLinks);

  if (!name) {
    return sendEmbed(message.channel, 'No tracks found');
  }

  guildManager.initializeGame(message, name, img, tracks, roundLimit);
};

const stop = (message) => {
  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to stop here!');
  }
  guildManager.finishGame(message.guild.id);
};

const skip = (message) => {
  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to skip here!');
  }
  guildManager.skipRound(message.guild.id, message.channel.id);
};

const help = (message, prefix) => {
  const helpEmbed = new MessageEmbed()
    .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
    .setDescription(HELP.description)
    .addField(
      'List of commands',
      HELP.commands.map((cmd) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'),
    );
  message.channel.send({ embed: helpEmbed });
};

client.login(token);

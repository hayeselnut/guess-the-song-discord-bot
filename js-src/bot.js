import Discord, { MessageEmbed } from 'discord.js';
import { config as configDotEnv } from 'dotenv';

import admin from 'firebase-admin';

import Spotify from './spotify/spotify.js';
import GuildManager from './guilds/guild-manager.js';
import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';
import { parseRoundDuration } from './helpers/helpers.js';
import Leaderboard from './guilds/game/leaderboard.js';

import HELP from './assets/help.json';

configDotEnv();

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
const db = admin.firestore();
const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify = new Spotify(clientId, clientSecret);


client.once('ready', () => {
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

  if (message.content.includes('@here') || message.content.includes('@everyone')) return;

  const { prefix } = guildManager.getConfig(message.guild.id);
  if (message.mentions.has(client.user.id)) {
    help(message, prefix);
  }

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
  } else if (message.content.startsWith(`${prefix}leaderboard`)) {
    leaderboard(message);
  } else if (message.content.startsWith(`${prefix}config`)) {
    config(message, prefix);
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message, prefix);
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}help\` for a list of commands.`);
  }
};

const start = async (message, prefix) => {
  const args = parseMessage(message);
  if (args.length < 3) {
    const [startHelp] = HELP.game_commands.filter((help) => help.usage.startsWith('start'));
    return sendEmbed(message.channel, `Usage: \`${prefix}${startHelp.usage}\``);
  }

  const roundLimit = parseRoundDuration(args[1]);
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

const leaderboard = (message) => {
  const leaderboard = new Leaderboard(Object.entries(guildManager.getLeaderboard(message.guild.id)));

  const leaderboardEmbed = new MessageEmbed()
    .setTitle('📊 All Time Leaderboard')
    .setDescription(leaderboard.toString());

  message.channel.send({ embed: leaderboardEmbed });
};

const config = (message) => {
  const args = parseMessage(message);
  if (args.length === 1) {
    const config = guildManager.getConfig(message.guild.id);
    const configEmbed = new MessageEmbed()
      .setTitle('Current configurations')
      .setDescription(`\`\`\`${Object.entries(config).map(([key, value]) => `${key}: ${value}`).join('\n')}\`\`\``);
    message.channel.send({ embed: configEmbed });
  } else {
    const key = args[1];
    if (key === 'reset') {
      return guildManager.resetConfig(message);
    }

    const value = args[2];
    if (!key || !value) {
      return sendEmbed(message.channel, 'Unknown config arguments');
    }

    switch (key) {
    case 'prefix':
      guildManager.updatePrefix(value, message);
      break;
    case 'round_duration':
      guildManager.updateRoundDuration(value, message);
      break;
    default:
      return sendEmbed(message.channel, 'Unknown config arguments');
    }
  }
};

const help = (message, prefix) => {
  const helpEmbed = new MessageEmbed()
    .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
    .setDescription(HELP.description)
    .addField(
      'Game commands',
      HELP.game_commands.map((cmd) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'),
    )
    .addField(
      'Help commands',
      HELP.help_commands.map((cmd) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'),
    );
  message.channel.send({ embed: helpEmbed });
};

client.login(token);

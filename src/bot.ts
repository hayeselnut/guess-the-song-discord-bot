// import Discord, { MessageEmbed } from 'discord.js';
import { Client, Message, MessageEmbed, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { getFirestoreDatabase } from './helpers/firestore-helpers';

import Spotify from './spotify/spotify';
import GuildManager from './guilds/guild-manager';

import HELP from './assets/help.json';
import { parseMessage, sendEmbed } from './helpers/discord-helpers';
import { HelpCommand, ValidMessage } from './types';
import Leaderboard from './guilds/game/leaderboard';
import { isValidMessage, isValidMessageWithVoiceChannel, parseRoundDuration } from './helpers/helpers';

dotenv.config();

const db = getFirestoreDatabase(
  process.env.FIREBASE_PROJECT_ID!,
  process.env.FIREBASE_PRIVATE_KEY!,
  process.env.FIREBASE_CLIENT_EMAIL!
);
const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Client({
  // ws: { intents: ["GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] }, // TODO
  messageEditHistoryMaxSize: 0,
  messageCacheMaxSize: 25,
  messageCacheLifetime: 21600,
  messageSweepInterval: 43200,
});

const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!
);

client.once('ready', () => {
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', (message: Message) => {
  if (!isValidMessage(message)) return;

  if (message.author.bot) return;

  if (message.content.includes('@here') || message.content.includes('@everyone')) return;

  // TODO: refactor so guild manager processes the command
  const prefix = guildManager.getConfig(message.guild.id)?.prefix || "$";
  if (message.mentions.has(client.user!.id)) {
    help(message, prefix);
  }

  if (message.content.startsWith(prefix)) {
    readCommand(message, prefix);
  } else {
    guildManager.checkGuess(message);
  }
});

const readCommand = (message: ValidMessage, prefix: string) => {
  if (message.content.startsWith(`${prefix}start`)) {
    start(message, prefix);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message);
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message);
  } else if (message.content.startsWith(`${prefix}leaderboard`)) {
    leaderboard(message);
  } else if (message.content.startsWith(`${prefix}config`)) {
    config(message);
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message, prefix);
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}help\` for a list of commands.`);
  }
};

const start = async (message: ValidMessage, prefix: string) => {
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

  if (!isValidMessageWithVoiceChannel(message)) {
    return sendEmbed(message.channel, 'You need to be in a voice channel to play music');
  }

  // TODO: maybe just do client.user
  // const permissions = voiceChannel.permissionsFor(message.client.user);
  // if (permissions && (!permissions.has('CONNECT') || !permissions.has('SPEAK'))) {
  //   return sendEmbed(message.channel, 'I need the permissions to join and speak in your voice channel');
  // }

  const playlistLinks = args.slice(2);
  const playlists = await spotify.getPlaylists(playlistLinks);

  if (!playlists) {
    return sendEmbed(message.channel, 'No tracks found');
  }

  const { name, img, tracks } = playlists;
  guildManager.initializeGame(message, name, img, tracks, roundLimit);
};

const stop = (message: ValidMessage) => {
  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to stop here!');
  }
  guildManager.finishGame(message.guild.id);
};

const skip = (message: ValidMessage) => {
  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to skip here!');
  }
  guildManager.skipRound(message.guild.id, message.channel.id);
};

const leaderboard = (message: ValidMessage) => {
  const leaderboard = new Leaderboard(guildManager.getLeaderboard(message.guild.id));

  const leaderboardEmbed = new MessageEmbed()
    .setTitle('📊 All Time Leaderboard')
    .setDescription(leaderboard.toString());

  message.channel.send({ embed: leaderboardEmbed });
};

const config = (message: ValidMessage) => {
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

const help = (message: ValidMessage, prefix: string) => {
  const helpEmbed = new MessageEmbed()
    .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
    .setDescription(HELP.description)
    .addField(
      'Game commands',
      HELP.game_commands.map((cmd: HelpCommand) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'),
    )
    .addField(
      'Help commands',
      HELP.help_commands.map((cmd: HelpCommand) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'),
    );
  message.channel.send({ embed: helpEmbed });
};

client.login(token);

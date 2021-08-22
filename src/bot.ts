// import Discord, { MessageEmbed } from 'discord.js';
import { Client, Message, MessageEmbed, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { getFirestoreDatabase } from './helpers/firestore-helpers';

import Spotify from './spotify/spotify';
import GuildManager from './guilds/guild-manager';

import HELP from './assets/help.json';
import { parseMessage, sendEmbed } from './helpers/discord-helpers';
import { HelpCommand } from './types';
import Leaderboard from './guilds/game/leaderboard';
import { parseRoundDuration } from './helpers/helpers';

dotenv.config();

const db = getFirestoreDatabase(
  process.env.FIREBASE_PROJECT_ID!,
  process.env.FIREBASE_PRIVATE_KEY!,
  process.env.FIREBASE_CLIENT_EMAIL!
);
const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Client();

const spotify = new Spotify(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!
);

console.log('made it here!');

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
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!(message.channel instanceof TextChannel)) return;

  if (message.content.includes('@here') || message.content.includes('@everyone')) return;

  const { prefix } = guildManager.getConfig(message.guild.id);
  if (message.mentions.has(client.user!.id)) {
    help(message, prefix);
  }

  if (message.content.startsWith(prefix)) {
    readCommand(message, prefix);
  } else {
    guildManager.checkGuess(message);
  }
});

const readCommand = (message: Message, prefix: string) => {
  if (!(message.channel instanceof TextChannel)) return;

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

const start = async (message: Message, prefix: string) => {
  if (!(message.channel instanceof TextChannel)) return;
  if (!message.guild) return;
  if (!message.member) return;

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

const stop = (message: Message) => {
  if (!(message.channel instanceof TextChannel)) return;
  if (!message.guild) return;

  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to stop here!');
  }
  guildManager.finishGame(message.guild.id);
};

const skip = (message: Message) => {
  if (!(message.channel instanceof TextChannel)) return;
  if (!message.guild) return;

  if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
    return sendEmbed(message.channel, 'Nothing to skip here!');
  }
  guildManager.skipRound(message.guild.id, message.channel.id);
};

const leaderboard = (message: Message) => {
  if (!(message.channel instanceof TextChannel)) return;
  if (!message.guild) return;

  const leaderboard = new Leaderboard(guildManager.getLeaderboard(message.guild.id));

  const leaderboardEmbed = new MessageEmbed()
    .setTitle('📊 All Time Leaderboard')
    .setDescription(leaderboard.toString());

  message.channel.send({ embed: leaderboardEmbed });
};

const config = (message: Message) => {
  if (!(message.channel instanceof TextChannel)) return;
  if (!message.guild) return;

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

const help = (message: Message, prefix: string) => {
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
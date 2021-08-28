import { Client, Intents, Message, MessageEmbed, Options, VoiceChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { getFirestoreDatabase } from './helpers/firestore-helpers';

import Spotify from './spotify/spotify';
import GuildManager from './guilds/guild-manager';

import HELP from './assets/help.json';
import { parseMessage, sendEmbed } from './helpers/discord-helpers';
import { HelpCommand, ValidMessage } from './types';
import Leaderboard from './guilds/game/leaderboard';
import { isValidMessage, isValidMessageWithVoiceChannel, parseRoundDuration, verifyEnv } from './helpers/helpers';
import ytdl from 'ytdl-core';

import Cookie from './assets/cookie.json';
import { createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType } from '@discordjs/voice';


dotenv.config();
verifyEnv();

const db = getFirestoreDatabase(
  process.env.FIREBASE_PROJECT_ID!,
  process.env.FIREBASE_PRIVATE_KEY!,
  process.env.FIREBASE_CLIENT_EMAIL!
);
const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN!;
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  makeCache: Options.cacheWithLimits({ MessageManager: {
    maxSize: 25,
    sweepInterval: 600,
  } }),
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

client.on('messageCreate', (message: Message) => {
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
  } else if (message.content.startsWith(`${prefix}test`)) {
    const voiceChannel = message.member.voice.channel!;
    const permissions = voiceChannel.permissionsFor(client.user!.id);
    if (permissions && (!permissions.has('CONNECT') || !permissions.has('SPEAK'))) {
      return sendEmbed(message.channel, 'I need the permissions to join and speak in your voice channel');
    }
    console.log(permissions?.toArray());

    const stream = ytdl('https://www.youtube.com/watch?v=C_3d6GntKbk', {
      filter: 'audioonly',
      requestOptions: {
        headers: Cookie,
      },
    })
    // const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary});
    const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
      inputType: StreamType.Arbitrary,
    });
    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel!.id,
      guildId: message.guild.id,
      adapterCreator: message.channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    connection.on('stateChange', (oldState, newState) => {
      console.log("STATE CHANGE", oldState.status, newState.status);
    })

    const audioPlayer = createAudioPlayer();
    audioPlayer.on('subscribe', () => {
      console.log('subscribed!');
    })
    audioPlayer.play(resource);
    connection.subscribe(audioPlayer);
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

  message.channel.send({ embeds: [leaderboardEmbed] });
};

const config = (message: ValidMessage) => {
  const args = parseMessage(message);
  if (args.length === 1) {
    const config = guildManager.getConfig(message.guild.id);
    const configEmbed = new MessageEmbed()
      .setTitle('Current configurations')
      .setDescription(`\`\`\`${Object.entries(config).map(([key, value]) => `${key}: ${value}`).join('\n')}\`\`\``);
    message.channel.send({ embeds: [configEmbed] });
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
  message.channel.send({ embeds: [helpEmbed] });
};

client.login(token);

import Discord from 'discord.js';
import { config } from 'dotenv';

import Spotify from './spotify.js';

import GameManager from './game-manager.js';
import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';

config();

const prefix = '$';
const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify = new Spotify(clientId, clientSecret);

const gameManager = new GameManager(spotify);

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

  if (message.content.startsWith(prefix)) {
    readCommand(message);
  } else {
    const game = gameManager.getGame(message);
    game?.checkGuess(message);
  }
});

const readCommand = (message) => {
  const ongoingGame = gameManager.getGame(message);
  if (message.content.startsWith(`${prefix}start`)) {
    start(message);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, ongoingGame);
  } else if (message.content.startsWith(`${prefix}pause`)) {
    // if (!ongoingGame) {
    //   return sendEmbed(message.channel, 'Nothing to pause here!');
    // }
    // ongoingGame.pauseGame();
  } else if (message.content.startsWith(`${prefix}resume`)) {
    // if (!ongoingGame) {
    //   return sendEmbed(message.channel, 'Nothing to resume here!');
    // }
    // ongoingGame.resumeGame();
  } else if (message.content.startsWith(`${prefix}skip`)) {
    // if (!ongoingGame) {
    //   return sendEmbed(message.channel, 'Nothing to skip here!');
    // }
    // ongoingGame.skipRound();
  } else if (message.content.startsWith(`${prefix}tutorial`)) {
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}help`)) {
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  // } else if (message.content.startsWith(`${prefix}leaderboard`)) {
  //   sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}help\` for a list of commands.`);
  }
};

const start = async (message) => {
  const args = parseMessage(message);
  if (args.length !== 2 && args.length !== 3) {
    return sendEmbed(message.channel, `Usage: \`${prefix}start <spotify_playlist_link>\``);
  }

  if (gameManager.has(message.guild.id)) {
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

  const playlistLink = args[1];
  const roundLimit = args[2] || Infinity;
  const { name, img, tracks } = await spotify.getPlaylist(playlistLink);

  gameManager.initializeGame(message, name, img, tracks, roundLimit);
};

const stop = (message, ongoingGame) => {
  if (!ongoingGame) {
    return sendEmbed(message.channel, 'Nothing to stop here!');
  }
  gameManager.finishGame(message.guild.id);
};

client.login(token);

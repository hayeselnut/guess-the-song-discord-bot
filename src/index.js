import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import YouTube from 'discord-youtube-api';

import { getSong, parseMessage, sendEmbed } from './helpers.js';
import Spotify from './spotify.js';

import config from './config.json';
import Guilds from './guilds.js';
import Game from './game.js';

const { prefix, token } = config.discord;
const client = new Discord.Client();

const { apiKey } = config.youtube;
const youtube = new YouTube(apiKey);

const { clientId, clientSecret } = config.spotify;
const spotify = new Spotify(clientId, clientSecret);

const guilds = new Guilds();

client.once('ready', () => {
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    readCommand(message);
  } else {
    const game = guilds.getGame(message);
    game?.checkGuess(message);
  }
});

const readCommand = async (message) => {
  const ongoingGame = guilds.getGame(message);
  if (message.content.startsWith(`${prefix}start`)) {
    // start(message, serverQueue);
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');

    // } else if (message.content.startsWith(`${prefix}stop`)) {
    //   stop(message);
  } else if (message.content.startsWith(`${prefix}ongoing`)) {
    sendEmbed(message.channel, `${!!ongoingGame}`);
  } else if (message.content.startsWith(`${prefix}spotify`)) {
    if (guilds.has(message.guild.id)) return sendEmbed(message.channel, `There's already a game running!`);
    const game = await startSpotify(message);
    guilds.startGame(message, game);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    if (!ongoingGame) return sendEmbed(message.channel, 'Nothing to stop here!');
    guilds.stopGame(message);
    sendEmbed(message.channel, 'Game has been stopped! Results have NOT been saved //TODO!.');
  } else if (message.content.startsWith(`${prefix}pause`)) {
    if (!ongoingGame) return sendEmbed(message.channel, 'Nothing to pause here!');
    ongoingGame.pauseGame();
  } else if (message.content.startsWith(`${prefix}resume`)) {
    if (!ongoingGame) return sendEmbed(message.channel, 'Nothing to resume here!');
    ongoingGame.resumeGame();
  } else if (message.content.startsWith(`${prefix}skip`)) {
    if (!ongoingGame) return sendEmbed(message.channel, 'Nothing to skip here!');
    ongoingGame.skipRound();
  } else if (message.content.startsWith(`${prefix}tutorial`)) {
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}help`)) {
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}leaderboard`)) {
    sendEmbed(message.channel, 'NOT YET IMPLEMENTED');
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}help\` for a list of commands.`);
  }
};

const startSpotify = async (message) => {
  const args = parseMessage(message);

  // TODO args can also be 3 to specify the max amount of times
  if (args.length !== 2 && args.length !== 3) {
    return sendEmbed(message.channel, `Usage: \`${prefix}spotify <spotify_playlist_link>\``);
  }

  const playlistLink = args[1];
  const customLimit = args[2] || Infinity;

  const { name, tracks } = await spotify.getPlaylist(playlistLink);
  const tracksLength = Object.keys(tracks).length;
  sendEmbed(message.channel, `Found playlist: **${name}** (${tracksLength} songs)`);

  return new Game(message, tracks, Math.min(tracksLength, customLimit));
};

// const start = async (message) => {
//   const args = parseMessage(message);
//   if (args.length === 1) return sendEmbed(message.channel, `Usage: \`${prefix}start <song_name>\``);

//   const voiceChannel = message.member.voice.channel;
//   if (!voiceChannel) return sendEmbed(message.channel, 'You need to be in a voice channel to play music');

//   const permissions = voiceChannel.permissionsFor(message.client.user);
//   if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
//     return sendEmbed(message.channel, 'I need the permissions to join and speak in your voice channel');
//   }

//   const song = await getSong(args[1]);
// };

//   const contract = database.getContractForGuild(message);
//   contract.enqueue(song);
//   sendEmbed(message.channel, `**${song.title}** has been added to the queue`);

//   try {
//     serverContract.connect(voiceChannel);
//     play(message.guild, serverContract.songs[0]);
//   } catch (err) {
//     return sendEmbed(message.channel, err);
//   }
// };

// const play = (guild, song) => {
// // TODO
//   const contract = database.getContractForGuild(message);

//   if (!song) {
//     serverContract.voiceChannel.leave();
//     database.delete(guild.id);
//     return;
//   }

//   const dispatcher = serverContract.connection
//     .play(ytdl(song.url))
//     .on('finish', () => {
//       serverContract.songs.shift();
//       play(guild, serverContract.songs[0]);
//     })
//     .on('error', (error) => console.error(error));
//   dispatcher.setVolumeLogarithmic(serverContract.volume / 5);
//   serverContract.textChannel.send(`Start playing: **${song.title}**`);
// };

client.login(token);

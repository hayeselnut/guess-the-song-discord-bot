import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import YouTube from 'discord-youtube-api';

import { getSong, parseMessage } from './helpers.js';
import Spotify from './spotify.js';

import config from './config.json';
import ServerContract from './server-contract.js';
import Database from './database.js';

const { prefix, token } = config.discord;
const client = new Discord.Client();

const { apiKey } = config.youtube;
const youtube = new YouTube(apiKey);

const { clientId, clientSecret } = config.spotify;
const spotify = new Spotify(clientId, clientSecret);

const database = new Database();

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
  if (!message.content.startsWith(prefix)) return;

  if (message.content.startsWith(`${prefix}start`)) {
    start(message, serverQueue);
  // } else if (message.content.startsWith(`${prefix}stop`)) {
  //   stop(message);
  } else if (message.content.startsWith(`${prefix}spotify`)) {
    startSpotify(message);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}pause`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}resume`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}tutorial`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}help`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else if (message.content.startsWith(`${prefix}leaderboard`)) {
    message.channel.send('NOT YET IMPLEMENTED');
  } else {
    message.channel.send(`Invalid command. Use \`${prefix}help\` for a list of commands.`);
  }
});

const startSpotify = async (message) => {
  const args = parseMessage(message);

  // TODO args can also be 3 to specify the max amount of times
  if (args.length !== 2) return message.channel.send(`Usage: \`${prefix}spotify <spotify_playlist_link>\``);


  const playlistLink = args[1];
  const { name, tracks } = await spotify.getPlaylist(playlistLink);

  message.channel.send(`Found playlist: **${name}** (${tracks.length} songs)`);
};

const start = async (message) => {
  const args = parseMessage(message);
  if (args.length === 1) return message.channel.send(`Usage: \`${prefix}start <song_name>\``);

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music');

  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('I need the permissions to join and speak in your voice channel');
  }

  const song = await getSong(args[1]);
};

//   const contract = database.getContractForGuild(message);
//   contract.enqueue(song);
//   message.channel.send(`**${song.title}** has been added to the queue`);

//   try {
//     serverContract.connect(voiceChannel);
//     play(message.guild, serverContract.songs[0]);
//   } catch (err) {
//     return message.channel.send(err);
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

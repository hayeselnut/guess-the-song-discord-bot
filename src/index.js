import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import SpotifyWebApi from 'spotify-web-api-node';
import YouTube from 'discord-youtube-api';

import config from './config.json';
import { getSong, parseMessage, parsePlaylistLink } from './helpers.js';
import ServerContract from './server-contract.js';
import Database from './database.js';

const { prefix, token } = config.discord;
const client = new Discord.Client();

const { clientId, clientSecret } = config.spotify;
const spotifyApi = new SpotifyWebApi({ clientId, clientSecret });

// Retrieve an access token.
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Something went wrong when retrieving an access token', err);
  },
);

const { apiKey } = config.youtube;
const youtube = new YouTube(apiKey);

// const test = async () => {
//   const arr = await youtube.getPlaylist('https://www.youtube.com/playlist?list=PL39z-AAkkats9VE4V8gdQyIjqp21nao9p');
//   console.log(arr);
// };
// test();

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
    readSpotifyPlaylist(message);
  } else {
    message.channel.send('Invalid command');
  }
});

const readSpotifyPlaylist = async (message) => {
  const args = parseMessage(message);
  if (args.length !== 2) return message.channel.send('Usage: `$spotify <spotify_playlist_link>`');

  const playlistLink = args[1];
  const playlistId = parsePlaylistLink(playlistLink);

  const playlistData = await spotifyApi.getPlaylist(playlistId);

  message.channel.send(`Found playlist: **${playlistData.body.name}**`);
  const trackIds = playlistData.body.tracks.items.map((trackData) => ({
    id: trackData.track.id,
    name: trackData.track.name,
    artists: trackData.track.artists.map((artistData) => artistData.name),
  }));
  message.channel.send('Songs in this playlist:\n' + trackIds.map((trackData) => `**${trackData.name}** - ${trackData.artists}\n`));
};

const start = async (message) => {
  const args = parseMessage(message);
  if (args.length === 1) return message.channel.send('Usage: `$start <song_name>`');

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

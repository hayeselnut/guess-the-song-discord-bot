import Discord, { MessageEmbed } from 'discord.js';
import YouTube from 'discord-youtube-api';
import { config } from 'dotenv';

import { parseMessage, sendEmbed } from './helpers.js';
import Spotify from './spotify.js';

import Guilds from './guilds.js';
import Game from './game.js';

config();

const prefix = '$';
const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();

const apiKey = process.env.YOUTUBE_API_KEY;
const youtube = new YouTube(apiKey);

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify = new Spotify(clientId, clientSecret, youtube);

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
    if (guilds.has(message.guild.id)) {
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

    const game = await startSpotify(message);
    guilds.startGame(message, game);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    if (!ongoingGame) {
      return sendEmbed(message.channel, 'Nothing to stop here!');
    }
    ongoingGame.finishGame();
    guilds.stopGame(message);
  } else if (message.content.startsWith(`${prefix}pause`)) {
    if (!ongoingGame) {
      return sendEmbed(message.channel, 'Nothing to pause here!');
    }
    ongoingGame.pauseGame();
  } else if (message.content.startsWith(`${prefix}resume`)) {
    if (!ongoingGame) {
      return sendEmbed(message.channel, 'Nothing to resume here!');
    }
    ongoingGame.resumeGame();
  } else if (message.content.startsWith(`${prefix}skip`)) {
    if (!ongoingGame) {
      return sendEmbed(message.channel, 'Nothing to skip here!');
    }
    ongoingGame.skipRound();
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

const startSpotify = async (message) => {
  const args = parseMessage(message);

  // TODO args can also be 3 to specify the max amount of times
  if (args.length !== 2 && args.length !== 3) {
    return sendEmbed(message.channel, `Usage: \`${prefix}start <spotify_playlist_link>\``);
  }

  const playlistLink = args[1];
  const customLimit = args[2] || Infinity;

  const { name, img, tracks } = await spotify.getPlaylist(playlistLink);
  const tracksLength = Object.keys(tracks).length;

  const playlistEmbed = new MessageEmbed()
    .setTitle(name)
    .setDescription(`Loading ${tracksLength} songs...`)
    .setImage(img);
  message.channel.send({ embed: playlistEmbed });

  return new Game(message, tracks, Math.min(tracksLength, customLimit), youtube);
};

// const play = async (message) => {
//   // Join
//   try {
//     const connection = await voiceChannel.join();
//     // Search using query
//     const youtubeQuery = args.slice(1).join(' ');
//     const video = await youtube.searchVideos(youtubeQuery);
//     console.log('playing' + video.title);

//     const dispatcher = connection.play(ytdl(video.url, { filter: 'audioonly' }));
//     console.log(dispatcher, connection);
//     // dispatcher.
//   } catch (err) {
//     console.log(err);
//   }
// };

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

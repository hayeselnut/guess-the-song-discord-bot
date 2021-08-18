import Discord, { MessageEmbed } from 'discord.js';
import { config } from 'dotenv';

import Spotify from './spotify/spotify.js';
import GameManager from './game/game-manager.js';
import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';
import { parseRoundLimit } from './helpers/helpers.js';

import HELP from './assets/help.json';

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
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, ongoingGame);
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message);
  } else {
    sendEmbed(message.channel, `Invalid command. Use \`${prefix}${HELP.help.usage}\` for a list of commands.`);
  }
};

const start = async (message) => {
  const args = parseMessage(message);
  if (args.length < 3) {
    return sendEmbed(message.channel, `Usage: \`${prefix}${HELP.start.usage}\``);
  }

  const roundLimit = parseRoundLimit(args[1]);
  if (isNaN(roundLimit)) {
    return sendEmbed(message.channel, `\`${args[1]}\` is not a valid round limit. Round limit must be an integer.`);
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

  const playlistLinks = args.slice(2);
  const { name, img, tracks } = await spotify.getPlaylists(playlistLinks);

  if (!name) {
    return sendEmbed(message.channel, 'No tracks found');
  }

  gameManager.initializeGame(message, name, img, tracks, roundLimit);
};

const stop = (message, ongoingGame) => {
  if (!ongoingGame) {
    return sendEmbed(message.channel, 'Nothing to stop here!');
  }
  gameManager.finishGame(message.guild.id);
};

const skip = (message, ongoingGame) => {
  if (!ongoingGame) {
    return sendEmbed(message.channel, 'Nothing to skip here!');
  }
  ongoingGame.skipRound();
};

const help = (message) => {
  const helpEmbed = new MessageEmbed()
    .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
    .setDescription(HELP.description)
    .addField('List of commands',
      `▶️ \`${prefix}${HELP.start.usage}\`: ${HELP.start.description}\n\n`
      + `⏹️ \`${prefix}${HELP.stop.usage}\`: ${HELP.stop.description}\n\n`
      + `⏭️ \`${prefix}${HELP.skip.usage}\`: ${HELP.skip.description}\n\n`
      + `ℹ️ \`${prefix}${HELP.help.usage}\`: ${HELP.help.description}\n\n`,
    );
  message.channel.send({ embed: helpEmbed });
};

client.login(token);

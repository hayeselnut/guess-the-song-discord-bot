// import Discord, { MessageEmbed } from 'discord.js';
import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
import { getFirestoreDatabase } from './helpers/firestore-helpers';


import Spotify from './spotify/spotify';
// import GuildManager from './guilds/guild-manager.js';
// import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';
// import { parseRoundDuration } from './helpers/helpers.js';
// import Leaderboard from './guilds/game/leaderboard.js';

// import HELP from './assets/help.json';

dotenv.config();

const db = getFirestoreDatabase(
  process.env.FIREBASE_PROJECT_ID!,
  process.env.FIREBASE_PRIVATE_KEY!,
  process.env.FIREBASE_CLIENT_EMAIL!
);
// const guildManager = new GuildManager(db);

const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();

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

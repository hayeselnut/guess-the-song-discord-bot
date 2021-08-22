"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// import Discord, { MessageEmbed } from 'discord.js';
const Discord = __importStar(require("discord.js"));
const dotenv = __importStar(require("dotenv"));
const firestore_helpers_1 = require("./helpers/firestore-helpers");
// import Spotify from './spotify/spotify.js';
// import GuildManager from './guilds/guild-manager.js';
// import { parseMessage, sendEmbed } from './helpers/discord-helpers.js';
// import { parseRoundDuration } from './helpers/helpers.js';
// import Leaderboard from './guilds/game/leaderboard.js';
// import HELP from './assets/help.json';
dotenv.config();
const db = firestore_helpers_1.getFirestoreDatabase(process.env.FIREBASE_PROJECT_ID, process.env.FIREBASE_PRIVATE_KEY, process.env.FIREBASE_CLIENT_EMAIL);
// const guildManager = new GuildManager(db);
const token = process.env.DISCORD_BOT_TOKEN;
const client = new Discord.Client();
// const clientId = process.env.SPOTIFY_CLIENT_ID;
// const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
// const spotify = new Spotify(clientId, clientSecret);
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

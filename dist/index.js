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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const bot_helpers_1 = require("./helpers/bot-helpers");
dotenv.config();
const discord_js_1 = require("discord.js");
const guilds_1 = __importDefault(require("./guild-manager/guilds"));
// import { getFirestoreDatabase } from './helpers/firestore-helpers';
const spotify_1 = __importDefault(require("./spotify/spotify"));
const spotify = new spotify_1.default(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
    ],
    makeCache: discord_js_1.Options.cacheWithLimits({ MessageManager: {
            maxSize: 25,
            sweepInterval: 600,
        } }),
});
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});
client.on('messageCreate', (message) => {
    // if (!ready) return;
    console.log(Object.keys(guilds_1.default).length);
    if (!(0, bot_helpers_1.isValidMessage)(message))
        return;
    if (message.author.bot)
        return;
    if (message.content.includes('@here') || message.content.includes('@everyone'))
        return;
});
const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);

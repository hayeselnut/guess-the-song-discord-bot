"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGuilds = exports.isValidMessageWithVoiceChannel = exports.isValidMessage = exports.parseRoundDuration = exports.randInt = exports.sleep = exports.shuffle = exports.verifyEnv = void 0;
const discord_js_1 = require("discord.js");
const game_manager_1 = __importDefault(require("../guilds/game-manager"));
const verifyEnv = () => {
    if (!process.env.DISCORD_BOT_TOKEN) {
        throw new Error('DISCORD_BOT_TOKEN variable not in environment');
    }
    if (!process.env.SPOTIFY_CLIENT_ID) {
        throw new Error('SPOTIFY_CLIENT_ID variable not in environment');
    }
    if (!process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('SPOTIFY_CLIENT_SECRET variable not in environment');
    }
    if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error('FIREBASE_PROJECT_ID variable not in environment');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('FIREBASE_PRIVATE_KEY variable not in environment');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('FIREBASE_CLIENT_EMAIL variable not in environment');
    }
};
exports.verifyEnv = verifyEnv;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
exports.shuffle = shuffle;
const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const randInt = (start, end) => Math.floor(Math.random() * (end - start) + start);
exports.randInt = randInt;
const parseRoundDuration = (limit) => {
    const base = 10;
    return parseInt(limit, base);
};
exports.parseRoundDuration = parseRoundDuration;
const isValidMessage = (message) => {
    if (!(message.channel instanceof discord_js_1.TextChannel))
        return false;
    if (!message.guild)
        return false;
    if (!message.member)
        return false;
    return true;
};
exports.isValidMessage = isValidMessage;
const isValidMessageWithVoiceChannel = (message) => {
    if (!((0, exports.isValidMessage)(message)))
        return false;
    if (!message.member.voice.channel)
        return false;
    return true;
};
exports.isValidMessageWithVoiceChannel = isValidMessageWithVoiceChannel;
const loadGuilds = async (db, guilds) => {
    const snapshot = await db.collection('guilds').get();
    snapshot.forEach((doc) => {
        guilds[doc.id] = new game_manager_1.default(db, null, doc.id, doc.data());
    });
};
exports.loadGuilds = loadGuilds;

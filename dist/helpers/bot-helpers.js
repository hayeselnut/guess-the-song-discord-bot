"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMessage = exports.verifyEnv = void 0;
const discord_js_1 = require("discord.js");
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

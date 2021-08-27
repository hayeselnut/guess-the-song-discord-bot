"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMessageWithVoiceChannel = exports.isValidMessage = exports.parseRoundDuration = exports.randInt = exports.sleep = exports.shuffle = void 0;
const discord_js_1 = require("discord.js");
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
    if (!(exports.isValidMessage(message)))
        return false;
    if (!message.member.voice.channel)
        return false;
    return true;
};
exports.isValidMessageWithVoiceChannel = isValidMessageWithVoiceChannel;

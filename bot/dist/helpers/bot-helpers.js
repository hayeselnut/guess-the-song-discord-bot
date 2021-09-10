"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmbed = exports.parseMessage = exports.isValidMessageWithVoice = exports.isValidMessage = void 0;
const discord_js_1 = require("discord.js");
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
const isValidMessageWithVoice = (message) => {
    if (!((0, exports.isValidMessage)(message)))
        return false;
    if (!message.member.voice.channel)
        return false;
    return true;
};
exports.isValidMessageWithVoice = isValidMessageWithVoice;
const parseMessage = (message) => message.content.split(/\s+/);
exports.parseMessage = parseMessage;
const sendEmbed = (channel, msg) => {
    channel.send({ embeds: [new discord_js_1.MessageEmbed().setDescription(msg)] });
};
exports.sendEmbed = sendEmbed;

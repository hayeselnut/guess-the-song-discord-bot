"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmbed = exports.tag = exports.parseMessage = void 0;
const discord_js_1 = require("discord.js");
const parseMessage = (message) => {
    return message.content.split(/\s+/);
};
exports.parseMessage = parseMessage;
const tag = (author) => `<@${author.id}>`;
exports.tag = tag;
const sendEmbed = (channel, msg) => {
    channel.send({ embeds: [new discord_js_1.MessageEmbed().setDescription(msg)] });
};
exports.sendEmbed = sendEmbed;

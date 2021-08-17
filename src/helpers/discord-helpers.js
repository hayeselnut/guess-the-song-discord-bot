import { MessageEmbed } from 'discord.js';

export const parseMessage = (message) => {
  return message.content.split(/\s+/);
};

export const tag = (author) => `<@${author.id}>`;

export const sendEmbed = (channel, msg) => {
  channel.send({ embed: new MessageEmbed().setDescription(msg) });
};

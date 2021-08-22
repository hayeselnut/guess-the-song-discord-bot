import { Channel, Message, MessageEmbed, TextChannel, User } from 'discord.js';

export const parseMessage = (message: Message) => {
  return message.content.split(/\s+/);
};

export const tag = (author: User) => `<@${author.id}>`;

export const sendEmbed = (channel: TextChannel, msg: string) => {
  channel.send({ embed: new MessageEmbed().setDescription(msg) });
};

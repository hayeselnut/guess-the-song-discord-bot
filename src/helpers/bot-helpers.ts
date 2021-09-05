import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { ValidMessage } from '../../src-old/types';
import { HelpCommand } from '../types/bot';
import { ValidMessageWithVoice } from '../types/discord';

export const isValidMessage = (message: Message): message is ValidMessage => {
  if (!(message.channel instanceof TextChannel)) return false;
  if (!message.guild) return false;
  if (!message.member) return false;
  return true;
};

export const isValidMessageWithVoice = (message: Message): message is ValidMessageWithVoice => {
  if (!(isValidMessage(message))) return false;
  if (!message.member.voice.channel) return false;
  return true;
};

export const parseMessage = (message: Message) => message.content.split(/\s+/);

export const sendEmbed = (channel: TextChannel, msg: string) => {
  channel.send({ embeds: [new MessageEmbed().setDescription(msg)] });
};

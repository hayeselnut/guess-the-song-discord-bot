import { Message, TextChannel } from "discord.js";
import { ValidMessage, ValidMessageWithVoiceChannel as ValidMessageWithVoiceChannel } from "../types";

export const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

export const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export const randInt = (start: number, end: number) => Math.floor(Math.random() * (end - start) + start);

export const parseRoundDuration = (limit: string) => {
  const base = 10;
  return parseInt(limit, base);
};

export const isValidMessage = (message: Message): message is ValidMessage => {
  if (!(message.channel instanceof TextChannel)) return false;
  if (!message.guild) return false;
  if (!message.member) return false;
  return true;
}

export const isValidMessageWithVoiceChannel = (message: Message): message is ValidMessageWithVoiceChannel => {
  if (!(isValidMessage(message))) return false;
  if (!message.member.voice.channel) return false;
  return true;
}
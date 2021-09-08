import Help from '../assets/help.json';
import client from '../client/client';

import { ValidMessageWithVoice } from '../types/discord';

export const parseStartGameArgs = (args: string[], prefix: string) => {
  if (args.length < 3) {
    const startHelp = Help.commands.start;
    throw new Error(`Usage: \`${prefix}${startHelp.usage}\``);
  }

  const base = 10;
  const roundLimit = parseInt(args[1], base);
  if (isNaN(roundLimit) || roundLimit <= 0) {
    throw new Error(`\`${args[1]}\` is not a valid round limit. Round limit must be a positive integer.`);
  }

  const playlistLinks = args.slice(2);

  return { roundLimit, playlistLinks };
};

export const throwIfInsufficientVoicePermissions = (message: ValidMessageWithVoice) => {
  const permissions = message.member.voice.channel.permissionsFor(client.user!);
  if (permissions && !(permissions.has('CONNECT') && permissions.has('SPEAK'))) {
    throw new Error('I need the permissions to join and speak in your voice channel');
  }
};

export const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

export const randSeek = (vidSecs: number) => {
  const start = 0;
  const end = vidSecs * 0.75;

  // Sets the seek time to a random point between the start and 75% of the video
  return Math.floor(Math.random() * (end - start) + start);
};

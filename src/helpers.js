import ytdl from 'ytdl-core';
import { MessageEmbed } from 'discord.js';

import Song from './song.js';

export const parseMessage = (message) => {
  return message.content.split(/\s+/);
};

export const getSong = async (url) => {
  const songData = await ytdl.getInfo(url);
  return new Song(songData);
};

export const normalizeName = (str) =>
  str.normalize('NFD')
    .toLowerCase()
    .replace(/\(.*/g, '')
    .replace(/\[.*/g, '')
    .replace(/\{.*/g, '')
    .replace(/-.*/g, '')
    .replace(/feat\. .*/g)
    .replace(/ft\. .*/g)
    .replace(' & ', ' and ')
    .replace('f**k', 'fuck') // F**king Perfect
    .replace(/[^a-z0-9]/g, '');

export const normalizeArtist = (str) =>
  str.normalize('NFD')
    .toLowerCase()
    .replace(' & ', ' and ')
    .replace('a$ap', 'asap') // A$AP Rocky
    .replace('mø', 'mo') // MØ
    .replace('p!nk', 'pink') // P!nk
    .replace(/[^a-z0-9]/g, '');

export const normalizeTrack = (name, artists) => {
  const normalizedArtists = artists.map((artist) => normalizeArtist(artist));
  let normalizedName = normalizeName(name);

  if (normalizedName.includes('feat') && normalizedArtists.some((a) => normalizedName.includes(a))) {
    normalizedName = normalizedName.split('feat')[0];
  }

  return { normalizedName, normalizedArtists };
};

export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

export const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));

export const tag = (author) => `<@${author.id}>`;

export const sendEmbed = (channel, msg) => {
  channel.send({ embed: new MessageEmbed().setDescription(msg) });
};

import ytdl from 'ytdl-core';
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
    .replace(/[^a-z0-9]/g, '');

export const normalizeArtist = (str) =>
  str.normalize('NFD')
    .replace('$', 's') // A$AP ROCKY
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const normalizeTrack = (name, artists) => {
  const normalizedArtists = artists.map((artist) => normalizeArtist(artist));
  let normalizedName = normalizeName(name);

  if (normalizedName.includes('feat') && normalizedArtists.some((a) => normalizedName.includes(a))) {
    normalizedName = normalizedName.split('feat')[0];
  }

  return { normalizedName, normalizedArtists };
};

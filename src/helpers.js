import ytdl from 'ytdl-core';
import Song from './song.js';

export const parseMessage = (message) => {
  return message.content.split(/\s+/);
};

export const getSong = async (url) => {
  const songData = await ytdl.getInfo(url);
  return new Song(songData);
};

export const noramlize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

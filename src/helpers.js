import ytdl from 'ytdl-core';
import Song from './song.js';

export const parseMessage = (message) => {
  return message.content.split(/\s+/);
};

export const parsePlaylistLink = (playlistLink) => {
  if (playlistLink.includes('playlist/')) {
    playlistLink = playlistLink.split('playlist/')[1];
  }

  if (playlistLink.includes('?')) {
    playlistLink = playlistLink.split('?')[0];
  }

  return playlistLink;
};

export const getSong = async (url) => {
  const songData = await ytdl.getInfo(url);
  return new Song(songData);
};

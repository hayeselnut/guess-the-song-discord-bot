import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { Tracks } from '../types/tracks';
import Cookie from '../assets/cookie.json';
import { shuffle } from '../helpers/game-helpers';
import { AudioResourceWithTrack } from '../types/discord';

export default class AudioResourceBuffer {
  buffer: AudioResourceWithTrack[];
  bufferSize: number;
  bufferIndex: number;
  roundLimit: number;
  tracks: Tracks;
  order: string[];

  constructor(tracks: Tracks, roundLimit: number) {
    this.buffer = [];
    this.bufferSize = 5;
    this.bufferIndex = 0;
    this.roundLimit = roundLimit;
    this.tracks = tracks;
    this.order = shuffle(Object.keys(tracks)).slice(0, this.roundLimit);
  }

  async initializeBuffer() {
    while (this.bufferIndex < Math.min(this.bufferSize, this.roundLimit)) {
      await this._pushNewAudioResourceToBuffer();
    }
  }

  getNextAudioResourceAndUpdateBuffer() {
    // Buffer a new track if possible
    if (this.bufferIndex < this.roundLimit) {
      this._pushNewAudioResourceToBuffer();
    }

    // Return next audio resource
    return this.buffer.shift();
  }

  async _pushNewAudioResourceToBuffer() {
    const trackId = this.order[this.bufferIndex];
    const track = this.tracks[trackId];
    const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
    const youtubeResults = await yts(youtubeQuery);
    const video = youtubeResults.videos[0];
    const stream = ytdl(video.url, {
      filter: 'audioonly',
      requestOptions: {
        headers: Cookie,
      },
    });
    // TODO handle error on load
    const audioResource: AudioResourceWithTrack = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      metadata: track,
      // playbackDuration: ???
    }); // TODO no seek option?
    this.buffer.push(audioResource);
    this.bufferIndex++;
  }
}

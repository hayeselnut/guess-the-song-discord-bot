import { createAudioResource, StreamType } from '@discordjs/voice';
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import prism from 'prism-media';
import fs from 'fs';

import { Tracks } from '../types/tracks';
import Cookie from '../assets/cookie.json';
import { shuffle } from '../helpers/game-helpers';
import { AudioResourceWithTrack } from '../types/discord';

// These are arguments used to convert the input to a format suitable for @discordjs/voice
const FFMPEG_ARGUMENTS = [
  '-analyzeduration', '0',
  '-loglevel', '0',
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2',
];

//   const FFMPEG_OPUS_ARGUMENTS = [
//     '-analyzeduration', '0',
//     '-loglevel', '0',
//     '-acodec', 'libopus',
//     '-f', 'opus',
//     '-ar', '48000',
//     '-ac', '2',
// ];

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

    // An audio stream starting from 30secs in
    const transcoder = new prism.FFmpeg({
      args: ['-ss', '30', ...FFMPEG_ARGUMENTS],
    });

    const audioResource = createAudioResource(stream.pipe(transcoder), {
      inputType: StreamType.Raw,
      metadata: track,
    });

    this.buffer.push(audioResource as AudioResourceWithTrack);
    this.bufferIndex++;
  }
}

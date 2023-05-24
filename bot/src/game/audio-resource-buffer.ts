import { createAudioResource, StreamType } from '@discordjs/voice';
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import prism from 'prism-media';

import { AudioResourceWithTrack } from '../types/discord';
import { Tracks } from '../types/tracks';
import { randSeek, shuffle } from '../helpers/game-helpers';
import Cookie from '../assets/cookie.json';

// These are arguments used to convert the input to a format suitable for @discordjs/voice
const FFMPEG_ARGUMENTS = [
  '-analyzeduration', '0',
  '-loglevel', '0',
  '-f', 's16le',
  '-ar', '48000',
  '-ac', '2',
];

export default class AudioResourceBuffer {
  buffer: AudioResourceWithTrack[] = [];
  bufferSize: number = 5;
  bufferIndex: number = 0;
  order: string[];

  constructor(
    private readonly tracks: Tracks,
    private readonly roundLimit: number,
  ) {
    this.order = shuffle(Object.keys(tracks)).slice(0, this.roundLimit);
  }

  async initializeBuffer() {
    while (this.bufferIndex < Math.min(this.bufferSize, this.roundLimit)) {
      await this.pushNewAudioResourceToBuffer();
    }
  }

  getNextAudioResourceAndUpdateBuffer() {
    // Buffer a new track if possible
    if (this.bufferIndex < this.roundLimit) {
      this.pushNewAudioResourceToBuffer();
    }

    // Return next audio resource
    return this.buffer.shift();
  }

  private async pushNewAudioResourceToBuffer() {
    const trackId = this.order[this.bufferIndex];

    // Increment index as soon as possible so that another call to this function won't push the same song to buffer
    this.bufferIndex++;

    const track = this.tracks[trackId];
    const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
    const youtubeResults = await yts(youtubeQuery);
    const video = youtubeResults.videos[0];

    const stream = ytdl(video.videoId, {
      filter: 'audioonly',
      highWaterMark: 1<<25,
      requestOptions: {
        headers: Cookie,
      },

      // // Disabling chunking recommended by node-ytdl-core documentation
      dlChunkSize: 0,
    }).on('error', (error: Error) => {
      console.error(`ERROR when loading '${track.name}' into buffer: ${error.message}`);
    });

    // Seeks a random time
    const transcoder = new prism.FFmpeg({
      args: ['-ss', `${randSeek(video.seconds)}`, ...FFMPEG_ARGUMENTS],
    });

    const audioResource: AudioResourceWithTrack = createAudioResource(stream.pipe(transcoder), {
      inputType: StreamType.Raw,
      metadata: track,
    });

    this.buffer.push(audioResource);
  }
}

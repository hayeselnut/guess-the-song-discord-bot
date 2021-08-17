/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { tag, sendEmbed } from '../helpers/discord-helpers.js';
import { shuffle } from '../helpers/helpers.js';
import { removeAdditionalInformation, normalize } from '../helpers/normalize-helpers.js';

const SONG_INDEX = -1;

export default class Game {
  constructor(message, tracks, limit) {
    // Discord things
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;
    this.connection = null;

    // Game
    this.tracks = tracks;
    this.limit = limit;
    this.order = shuffle(Object.keys(tracks)).slice(0, this.limit);
    this.streamsBuffer = []; // Buffer of next 3 streams
    this.streamsBufferLimit = 3;
    this.currRound = 0;
    this.playing = false;
    this.paused = false;
    this.leaderboard = new Map();

    // Round
    this.timeout = null;
    this.currTrack = this.tracks[this.order[this.currRound]];
    this.availablePoints = this.currTrack.artists.length + 1;
    this.answered = new Map(); // -1 is song, 0..n-1 is for each of the n artists

    this.startGame();
  }

  async startGame() {
    // Load buffer of next 3 streams
    for (let i = 0; i < Math.min(this.streamsBufferLimit, this.limit); i++) {
      await this.loadStream(i);
    }
    await this.connectToVoiceChannel();
    this.startRound();
  }

  async loadStream(index) {
    const track = this.tracks[this.order[index]];
    const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
    const video = (await yts(youtubeQuery)).videos[0];
    this.streamsBuffer.push(ytdl(video.url, { filter: 'audioonly' }));
  }

  async connectToVoiceChannel() {
    if (this.connection) return;

    try {
      this.connection = await this.voiceChannel.join();
    } catch (err) {
      console.error(err);
      this.connection = null;
    }
  }

  async playTrack() {
    // Load next next song (if possible)
    if (this.currRound + this.streamsBufferLimit < this.limit) {
      this.loadStream(this.currRound + this.streamsBufferLimit);
    }
    this.connection.play(this.streamsBuffer.shift(), { seek: randStart(60, 30) });

    this.playing = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.skipRound('Too slow! Skipping song...');
    }, 30000);
  }

  async startRound() {
    if (this.currRound >= this.limit) return this.finishGame();

    if (!this.connection) {
      sendEmbed(this.textChannel, 'Could not join voice channel');
      return this.finishGame();
    }

    this.playing = false;
    this.currTrack = this.tracks[this.order[this.currRound]];
    this.availablePoints = this.currTrack.artists.length + 1;
    this.answered = new Map([
      [SONG_INDEX, ''],
      ...this.track.artists.map((_, i) => [i, '']),
    ]);

    this.playTrack();
    sendEmbed(this.textChannel, `[${this.currRound + 1}/${this.limit}] Starting next song...`);
    console.log(this.currTrack);
  }

  addPoint(author, answer) {
    const authorTag = tag(author);
    this.answered.set(answer, authorTag);
    this.availablePoints--;
    this.leaderboard.set(authorTag, (this.leaderboard.get(authorTag) || 0) + 1);
    this.displayProgress();
  }

  checkGuess(message) {
    const guess = message.content;
    if (!this.playing) return;

    const normalizedGuessForName = normalize(guess, 'name');
    const normalizedGuessForArtist = normalize(guess, 'artist');

    if (!this.answered.get(SONG_INDEX) && normalizedGuessForName == this.currTrack.normalizedName) {
      this.addPoint(message.author, SONG_INDEX);
    }

    this.currTrack.normalizedArtists.forEach((artist, index) => {
      if (this.answered.get(index)) return;
      if (artist != normalizedGuessForArtist) return;
      this.addPoint(message.author, index);
    });

    if (this.availablePoints) return;
    this.finishRound();
  }

  displayProgress(reason='') {
    const displayName = removeAdditionalInformation(this.currTrack.name);

    const nameProgress = this.answered.get(SONG_INDEX)
      ? `✅ Song: **${displayName}** guessed correctly by ${this.answered.get(SONG_INDEX)} (+1)`
      : reason
        ? `❌ Song: **${displayName}**`
        : `⬜ Song: **???**`;
    const artistsProgress = this.currTrack.artists.map((artist, index) => (
      this.answered.get(index)
        ? `✅ Artist: **${artist}** guessed correctly by ${this.answered.get(index)} (+1)`
        : reason
          ? `❌ Artist: **${artist}**`
          : `⬜ Artist: **???**`
    )).join('\n');

    const progressEmbed = new MessageEmbed()
      .setTitle(reason)
      .setDescription(`${nameProgress}\n${artistsProgress}`);
    if (!this.availablePoints || reason) {
      const sortedLeaderboard = [...this.leaderboard.entries()]
        .sort(([, aPoints], [, bPoints]) => bPoints - aPoints)
        .map(([authorTag, points], index) => `**${index + 1}**. (${points}) ${authorTag}`)
        .join('\n');

      progressEmbed
        .setThumbnail(this.currTrack.img)
        .addField('\u200B', '\u200B')
        .addField('🏆 Leaderboard', sortedLeaderboard || 'No points earned yet!');
    }
    this.textChannel.send({ embed: progressEmbed });
  }

  pauseGame() {
    if (this.paused) {
      sendEmbed(this.textChannel, 'Game has already been paused');
    } else {
      this.paused = true;
      sendEmbed(this.textChannel, 'Pausing game after this round...');
    }
  }

  resumeGame() {
    if (!this.paused) return;

    this.paused = false;
    sendEmbed(this.textChannel, '▶️ Resuming game...');
    this.startRound();
  }

  skipRound(reason='Skipping song...') {
    this.currRound++;
    this.displayProgress(reason);
    this.startRound();
  }

  finishRound() {
    this.currRound++;
    if (this.paused) return sendEmbed(this.textChannel, '⏸️ Game has been paused.');

    this.startRound();
  }

  finishGame() {
    this.currRound = this.limit;
    this.connection = null;
    clearTimeout(this.timeout);
    this.voiceChannel.leave();
    const sorted = [...this.leaderboard.entries()]
      .sort(([, aPoints], [, bPoints]) => bPoints - aPoints);

    if (sorted[0]) {
      const [authorTag]= sorted[0];
      this.textChannel.send({ embed: new MessageEmbed()
        .setTitle('🏁 Finished!')
        .setDescription(`${authorTag} is the winner!`),
      });
    }
  }
}

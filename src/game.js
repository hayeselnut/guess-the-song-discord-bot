/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';

import ytdl from 'ytdl-core';

import { normalizeName, normalizeArtist, shuffle, sleep, tag, sendEmbed } from './helpers.js';

const SONG_INDEX = -1;

export default class Game {
  constructor(message, tracks, limit, youtube) {
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;
    this.connection = null;

    this.youtube = youtube;
    this.timeout = null;

    this.tracks = tracks;
    this.limit = limit;
    this.order = shuffle(Object.keys(tracks)).slice(0, this.limit);
    this.streams = [];
    this.curr = 0;
    this.currTrack = this.tracks[this.order[this.curr]];
    this.answered = new Map();
    // -1 is song
    // 0..n-1 is for each of the n artists
    this.availablePoints = this.currTrack.artists.length + 1;
    this.playing = false;
    this.paused = false;
    this.leaderboard = new Map();

    this.startGame();
  }

  async startGame() {
    try {
      this.streams = (await Promise.all(this.order.map((trackId) => {
        const track = this.tracks[trackId];
        const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
        console.log(youtubeQuery);
        return this.youtube.searchVideos(youtubeQuery);
      }))).map((video) => ytdl(video.url, { filter: 'audioonly' }));
    } catch (err) {
      console.error(err);
    }

    this.startRound();
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
    this.connection.play(this.streams[this.curr], { seek: Math.floor(Math.random() * 30) + 30 });
    this.playing = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.skipRound('Too slow! Skipping song...');
    }, 30000);
  }

  async startRound() {
    if (this.curr >= this.limit) return this.finishGame();

    await this.connectToVoiceChannel();
    if (!this.connection) {
      sendEmbed('Could not join voice channel');
      return this.finishGame();
    }

    this.playing = false;
    this.currTrack = this.tracks[this.order[this.curr]];
    this.availablePoints = this.currTrack.artists.length + 1;
    this.answered.clear();
    this.answered.set(SONG_INDEX, '');
    this.currTrack.artists.forEach((artist, index) => this.answered.set(index, ''));

    this.playTrack();
    sendEmbed(this.textChannel, `[${this.curr + 1}/${this.limit}] Starting next song in 2 seconds...`);
    await sleep(2000);

    console.log(this.currTrack);
  }

  addPoint(author) {
    const authorTag = tag(author);
    this.leaderboard.set(authorTag, (this.leaderboard.get(authorTag) || 0) + 1);
  }

  checkGuess(message) {
    const guess = message.content;
    if (!this.playing) return;

    const normalizedGuessForName = normalizeName(guess);
    const normalizedGuessForArtist = normalizeArtist(guess);

    if (!this.answered.get(SONG_INDEX) && normalizedGuessForName == this.currTrack.normalizedName) {
      this.answered.set(SONG_INDEX, tag(message.author));
      this.availablePoints--;
      this.addPoint(message.author);
      this.displayProgress();
    }

    this.currTrack.normalizedArtists.forEach((artist, index) => {
      if (this.answered.get(index)) return;
      if (artist != normalizedGuessForArtist) return;

      this.answered.set(index, tag(message.author));
      this.availablePoints--;
      this.addPoint(message.author);
      this.displayProgress();
    });

    if (this.availablePoints) return;

    this.curr++;
    if (!this.paused) {
      this.startRound();
    } else {
      sendEmbed(this.textChannel, '⏸️ Game has been paused.');
    }
  }

  displayProgress(reason='') {
    const displayName = this.currTrack.name
      .replace(/\(.*/g, '')
      .replace(/\[.*/g, '')
      .replace(/\{.*/g, '')
      .replace(/-.*/g, '')
      .replace(/feat\. .*/g)
      .replace(/ft\. .*/g);

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
        .sort(([, aPoints], [, bPoints]) => aPoints > bPoints)
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
    this.curr++;
    this.displayProgress(reason);
    this.startRound();
  }

  finishGame() {
    this.curr = this.limit;
    this.connection = null;
    clearTimeout(this.timeout);
    this.voiceChannel.leave();
    const sorted = [...this.leaderboard.entries()]
      .sort(([, aPoints], [, bPoints]) => aPoints < bPoints);

    if (sorted[0]) {
      const [authorTag]= sorted[0];
      this.textChannel.send({ embed: new MessageEmbed()
        .setTitle('🏁 Finished!')
        .setDescription(`${authorTag} is the winner!`),
      });
    }
  }
}

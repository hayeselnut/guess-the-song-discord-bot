/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';

import { normalizeName, normalizeArtist, shuffle, sleep, tag, sendEmbed } from './helpers.js';

export default class Game {
  constructor(message, tracks, limit) {
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channnel;
    this.connection = null;

    this.tracks = tracks;
    this.order = shuffle(Object.keys(tracks));
    this.curr = 0;
    this.currTrack = this.tracks[this.order[this.curr]];
    this.answered = new Map();
    this.availablePoints = this.currTrack.artists.length + 1;
    this.limit = limit;
    this.playing = false;
    this.paused = false;
    this.leaderboard = new Map();

    this.startRound();
  }

  async startRound() {
    if (this.curr >= this.limit) return this.finishGame();

    this.playing = false;
    this.currTrack = this.tracks[this.order[this.curr]];
    this.availablePoints = this.currTrack.artists.length + 1;
    this.answered.clear();
    this.answered.set('#song', '');
    this.currTrack.artists.forEach((artist) => this.answered.set(artist, ''));

    sendEmbed(this.textChannel, `[${this.curr + 1}/${this.limit}] Starting next song in 2 seconds...`);
    await sleep(2000);

    this.playing = true;
    this.textChannel.send(`The song is **${this.currTrack.name}**`);
  }

  addPoint(author) {
    const authorTag = tag(author);
    this.leaderboard.set(authorTag, (this.leaderboard.get(authorTag) || 0) + 1);
  }

  checkGuess(message) {
    const guess = message.content;
    console.log(this.answered);
    if (!this.playing) return;

    const normalizedGuessForName = normalizeName(guess);
    const normalizedGuessForArtist = normalizeArtist(guess);

    if (!this.answered.get('#song') && normalizedGuessForName == this.currTrack.normalizedName) {
      this.answered.set('#song', tag(message.author));
      this.availablePoints--;
      this.addPoint(message.author);
      this.displayProgress();
    }

    this.currTrack.normalizedArtists.forEach((artist, index) => {
      if (this.answered.get(artist)) return;
      if (artist != normalizedGuessForArtist) return;

      this.answered.set(this.currTrack.artists[index], tag(message.author));
      this.availablePoints--;
      this.addPoint(message.author);
      this.displayProgress();
    });

    if (this.availablePoints) return;

    this.curr++;
    this.displayLeaderboard();
    console.log(this.leaderboard);
    if (!this.paused) {
      this.startRound();
    } else {
      sendEmbed(this.textChannel, '⏸️ Game has been paused.');
    }
  }

  displayProgress(final=false) {
    const nameProgress = this.answered.get('#song')
      ? `✅ Song: **${this.currTrack.name}** guessed correctly by ${this.answered.get('#song')} (+1)`
      : final
        ? `❌ Song: **${this.currTrack.name}**`
        : `⬜ Song: **???**`;
    const artistsProgress = this.currTrack.artists.map((artist) => (
      this.answered.get(artist)
        ? `✅ Artist: **${artist}** guessed correctly by ${this.answered.get(artist)} (+1)`
        : final
          ? `❌ Artist: **${artist}**`
          : `⬜ Artist: **???**`
    )).join('\n');

    const progressEmbed = new MessageEmbed().setDescription(`${nameProgress}\n${artistsProgress}`);
    if (!this.availablePoints || final) {
      progressEmbed.setThumbnail(this.currTrack.img);
    }
    this.textChannel.send({ embed: progressEmbed });
  }

  displayLeaderboard() {
    const sorted = [...this.leaderboard.entries()]
      .sort(([, aPoints], [, bPoints]) => aPoints > bPoints)
      .map(([authorTag, points], index) => `${index + 1}. (${points}) ${authorTag}`)
      .join('\n');

    this.textChannel.send({ embed: new MessageEmbed()
      .setTitle('🏆 Leaderboard')
      .setDescription(sorted),
    });
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

  skipRound() {
    this.curr++;

    this.displayProgress(true);
    this.displayLeaderboard();

    this.startRound();
  }

  finishGame() {
    const sorted = [...this.leaderboard.entries()]
      .sort(([, aPoints], [, bPoints]) => aPoints > bPoints);

    if (sorted[0]) {
      const [authorTag]= sorted[0];
      this.textChannel.send({ embed: new MessageEmbed()
        .setTitle('🏁 Finished!')
        .setDescription(`${authorTag} is the winner!`),
      });
    }
  }
}

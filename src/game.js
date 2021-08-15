/* eslint-disable require-jsdoc */
import { normalizeName, normalizeArtist } from './helpers.js';

export default class Game {
  constructor(message, tracks, limit) {
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channnel;
    this.connection = null;

    this.tracks = tracks;
    this.seen = new Set();
    this.currentTrack = '';
    this.alreadyAnswered = new Set();
    this.limit = limit;
    this.paused = false;
    this.leaderboard = new Map();
  }

  startRound() {

  }

  addToLeaderboard(player) {
    if (this.players.has(player)) return;
    this.players.set(player, 0);
  }

  addPoint(player) {
    this.addToLeaderboard(player);
    this.leaderboard.set(player, this.leaderboard.get(player) + 1);
  }

  checkGuess(guess) {
    message.channel.send(`You guessed: ${guess}`);
    if (!this.currentTrack.length) return;

    const normalizedGuessForName = normalizeName(guess);
    const normalizedGuessForArtist = normalizeArtist(guess);

    if (normalizedGuessForName == tracks[currentTrack].normalizedName) {

    }

    if (tracks[currentTrack].normalizedArtist.includes(normalizedGuessForArtist)) {

    }
    // if correct, add to alreadyAnswered

    // if final, clear already Answered and go to next song
  }
}

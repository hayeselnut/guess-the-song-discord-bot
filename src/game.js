/* eslint-disable require-jsdoc */
import { normalize } from './helpers.js';


export default class Game {
  constructor(tracks) {
    this.tracks = tracks;
    this.leaderboard = new Map();
    this.seen = new Set();
    this.currentTrack = '';
    this.alreadyAnswered = new Set();
  }

  addToLeaderboard(player) {
    if (this.players.has(player)) return;
    this.players.set(player, 0);
  }

  addPoint(player) {
    this.addToLeaderboard(player);
    this.leaderboard.set(player, this.leaderboard.get(player) + 1);
  }

  checkAnswer(guess) {
    if (!this.currentTrack.length) return;

    const normalizedGuess = noramlize(guess);
    const normalizedName = normalize(songs[this.currentTrack].name);
    const normalizedArtists = songs[this.currentTrack].artists.map((artist) => normalize(artist));

    // if correct, add to alreadyAnswered

    // if final, clear already Answered and go to next song
  }
}

/* eslint-disable require-jsdoc */
import { sendEmbed } from '../helpers/discord-helpers.js';
import { randInt } from '../helpers/helpers.js';
import Guesses from './Guesses.js';

export default class Round {
  constructor(track, stream, connection, textChannel, timeLimit, callback) {
    // Discord things
    this.connection = connection;
    this.textChannel = textChannel;

    // Current song
    this.track = track;
    this.stream = stream;

    this.guesses = new Guesses(this.track);

    // Ending things
    this.timeout = null;
    this.timeLimit = timeLimit;
    this.callback = callback;
  }

  startRound() {
    this._startTimeLimit();
    this._playTrack();
    console.log(this.track);
  }

  checkGuess(message) {
    const guessCorrect = this.guesses.checkGuess(message);
    if (this.guesses.guessedAll()) {
      this.endRound();
    } else if (guessCorrect) {
      this._showProgress();
    }
  }

  _showProgress() {
    sendEmbed(this.textChannel, this.guesses.toString());
  }

  endRound(useCallback=true) {
    clearTimeout(this.timeout);

    if (!useCallback) return;
    this.callback();
  }

  _playTrack() {
    // Start the music video at a random point between 0 and 90 seconds
    this.connection.play(this.stream, { seek: randInt(0, 90) });
  }

  _startTimeLimit() {
    this.timeout = setTimeout(() => {
      this.endRound();
    }, this.timeLimit * 1000);
  }
}

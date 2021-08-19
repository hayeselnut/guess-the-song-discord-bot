/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';
import { randInt } from '../helpers/helpers.js';
import Guesses from './guesses.js';

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
    const progressEmbed = new MessageEmbed()
      .setDescription(this.guesses.toString())
      .setColor('#F1C40F');

    this.textChannel.send({ embed: progressEmbed });
  }

  endRound(useCallback=true, title) {
    clearTimeout(this.timeout);

    if (!useCallback) return;
    this.callback(title);
  }

  _playTrack() {
    // Start the music video at a random point between 0 and 90 seconds
    if (!this.stream) {
      this.endRound(true, 'Could not load song. Skipping song...');
    }

    this.connection
      .play(this.stream, { seek: randInt(0, 90) })
      .on('error', (err) => {
        console.error(err);
        this.endRound(true, 'Could not load song. Skipping song...');
      });
  }

  _startTimeLimit() {
    this.timeout = setTimeout(() => {
      this.endRound(true, 'Too slow! Skipping song...');
    }, this.timeLimit * 1000);
  }
}

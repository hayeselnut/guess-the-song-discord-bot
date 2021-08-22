import { MessageEmbed, TextChannel, VoiceConnection } from 'discord.js';
import { randInt } from '../../helpers/helpers';
import { track } from '../../types.js';
import Guesses from './guesses.js';

export default class Round {
  connection: VoiceConnection;
  textChannel: TextChannel;
  track: track;
  stream: ReadableStream | null;
  guesses: Guesses;
  timeout: NodeJS.Timeout | null;
  timeLimit: number;
  callback: any;

  constructor(track: track, stream: ReadableStream, connection: VoiceConnection, textChannel: TextChannel, timeLimit: number, callback: any) {
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

    console.log(`#${this.textChannel.name}:`, this.track.name, this.track.artists);
    this._playTrack();
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

  endRound(useCallback: boolean = true, title?: string) {
    clearTimeout(this.timeout!);

    if (!useCallback) return;
    this.callback(title);
  }

  _playTrack() {
    // Start the music video at a random point between 0 and 90 seconds
    if (!this.stream) {
      console.error(`#${this.textChannel.name}:`, 'ERROR - Cannot play', this.track.name, this.track.artists);
      return this.endRound(true, 'Could not load song. Skipping song...');
    }
    try {
      this.connection
        .play(this.stream, { seek: randInt(0, 90) })
        .on('error', (err) => {
          console.error(err);
          console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists);
          return this.endRound(true, 'Could not load song. Skipping song...');
        });
    } catch (err) {
      console.error(err);
      console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists);
      return this.endRound(true, 'Could not load song. Skipping song...');
    }
  }

  _startTimeLimit() {
    this.timeout = setTimeout(() => {
      this.endRound(true, 'Too slow! Skipping song...');
    }, this.timeLimit * 1000);
  }
}

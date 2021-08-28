import { AudioPlayer, createAudioResource, VoiceConnection } from '@discordjs/voice';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import internal from 'stream';
import { randInt } from '../../helpers/helpers';
import { Track, ValidMessage } from '../../types.js';
import Guesses from './guesses.js';

export default class Round {
  audioPlayer: AudioPlayer;
  textChannel: TextChannel;
  track: Track;
  stream: internal.Readable | null;
  guesses: Guesses;
  timeout: NodeJS.Timeout | null;
  timeLimit: number;
  callback: any;

  constructor(track: Track, stream: internal.Readable, audioPlayer: AudioPlayer, textChannel: TextChannel, timeLimit: number, callback: any) {
    // Discord things
    this.audioPlayer = audioPlayer;
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

  checkGuess(message: ValidMessage) {
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

    this.textChannel.send({ embeds: [progressEmbed] });
  }

  endRound(useCallback: boolean = true, title?: string) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

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
      const audioResource = createAudioResource(this.stream); // TODO no seek option
      this.audioPlayer.play(audioResource);
      this.audioPlayer.on('error', (err: Error) => {
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

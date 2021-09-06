import { AudioPlayer, AudioResource } from '@discordjs/voice';
import { MessageEmbed, TextChannel } from 'discord.js';

import { AudioResourceWithTrack, ValidMessage } from '../types/discord';
import { EndRoundCallback, EndRoundReason } from '../types/game';
import { Track } from '../types/tracks';

import Guesses from './guesses';

export default class Round {
  audioPlayer: AudioPlayer;
  textChannel: TextChannel;
  track: Track;
  audioResource: AudioResourceWithTrack;
  guesses: Guesses;
  timer: NodeJS.Timeout;
  callback: EndRoundCallback;

  constructor(audioResource: AudioResourceWithTrack, audioPlayer: AudioPlayer, textChannel: TextChannel,
    timeLimit: number, callback: EndRoundCallback) {
    this.audioPlayer = audioPlayer;
    this.textChannel = textChannel;

    this.audioResource = audioResource;
    this.track = this.audioResource.metadata;

    this.guesses = new Guesses(this.track);

    this.callback = callback;
    this.timer = setTimeout(() => {
      console.debug('Timeout!');
      this.endRound('TIMEOUT', this.callback);
    }, timeLimit * 1000);
  }

  startRound() {
    // Start playing audio resource
    try {
      // Asssumes connection is already subscribed to audio resource
      this.audioPlayer.play(this.audioResource as AudioResource);
    } catch (err) {
      console.error(
        `#${this.textChannel.name}:`,
        '[ERROR CAUGHT IN CATCH] - Cannot play',
        this.track.name,
        this.track.artists,
        err,
      );
      return this.endRound('LOAD_FAIL', this.callback);
    }
  }

  checkGuess(message: ValidMessage) {
    const guessCorrect = this.guesses.checkGuess(message);
    if (guessCorrect && this.guesses.guessedAll()) {
      this.endRound('CORRECT', this.callback);
    } else if (guessCorrect) {
      this._showProgress();
    }
  }

  _showProgress() {
    const progressEmbed = new MessageEmbed()
      .setDescription(this.guesses.toProgressString())
      .setColor('GOLD');

    this.textChannel.send({ embeds: [progressEmbed] });
  }

  skipRound() {
    this.endRound('FORCE_SKIP', this.callback);
  }

  endRound(reason: EndRoundReason, callback?: EndRoundCallback) {
    clearTimeout(this.timer);

    if (callback) {
      callback(reason);
    }
  }
}

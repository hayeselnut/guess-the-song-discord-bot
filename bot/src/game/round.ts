import { AudioPlayer } from '@discordjs/voice';
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
    this.track = audioResource.metadata;

    this.guesses = new Guesses(this.track);

    this.callback = callback;
    this.timer = setTimeout(() => {
      this.endRound('TIMEOUT');
    }, timeLimit * 1000);
  }

  startRound() {
    // Start playing audio resource
    if (this.audioResource.ended) {
      console.log(`#${this.textChannel.name}: Could not load`, this.track.name, this.track.artists);
      return this.endRound('LOAD_FAIL');
    }

    this.audioPlayer.play(this.audioResource);
  }

  checkGuess(message: ValidMessage) {
    const guessCorrect = this.guesses.checkGuess(message);
    if (guessCorrect && this.guesses.guessedAll()) {
      this.endRound('CORRECT');
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

  endRound(reason: EndRoundReason) {
    clearTimeout(this.timer);

    setTimeout(() => {
      this.callback(reason);
    }, 100);
  }
}

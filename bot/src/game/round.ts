import { AudioPlayer } from '@discordjs/voice';
import { MessageEmbed, TextChannel } from 'discord.js';

import { AudioResourceWithTrack, ValidMessage } from '../types/discord';
import { EndRoundCallback, EndRoundReason } from '../types/game';
import { Track } from '../types/tracks';

import Guesses from './guesses';

export default class Round {
  finished: boolean
  audioPlayer: AudioPlayer;
  textChannel: TextChannel;
  track: Track;
  audioResource: AudioResourceWithTrack;
  guesses: Guesses;
  timer: NodeJS.Timeout;
  callback: EndRoundCallback;

  constructor(audioResource: AudioResourceWithTrack, audioPlayer: AudioPlayer, textChannel: TextChannel,
    timeLimit: number, callback: EndRoundCallback) {
    this.finished = false;

    this.audioPlayer = audioPlayer;
    this.textChannel = textChannel;

    this.audioResource = audioResource;
    this.track = audioResource.metadata;

    this.guesses = new Guesses(this.track);

    this.callback = callback;
    this.timer = setTimeout(() => {
      this.endRound('TIMEOUT');
    }, timeLimit * 1000); // timeLimit is in secs
  }

  startRound() {
    if (this.audioResource.ended) {
      console.log(`#${this.textChannel.name}: Could not load`, this.track.name, this.track.artists);
      return this.endRound('LOAD_FAIL');
    }

    // `started` flag will be false if stream has not finished loading or error occured e.g. 410 error
    // End round after 5 seconds if the resource has still not started (most likely caused by error)
    if (!this.audioResource.started) {
      console.log(`#${this.textChannel.name}: Delay when loading`, this.track.name, this.track.artists);
      setTimeout(() => {
        if (!this.audioResource.started) {
          console.log(`#${this.textChannel.name}: Did not load in time`, this.track.name, this.track.artists);
          this.endRound('LOAD_FAIL');
        } else {
          console.log(`#${this.textChannel.name}: Loaded successfully`, this.track.name, this.track.artists);
        }
      }, 5 * 1000);
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
    if (this.finished) {
      return console.log(`#${this.textChannel.name}: Tried to end round that has already been ended`);
    };

    this.finished = true;

    // Need a small time delay when ending rounds to ensure future end rounds dont execute before this one.
    // Basically ensures that rounds are ended in order.
    setTimeout(() => {
      this.callback(reason);
    }, 100);
  }
}

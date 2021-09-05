import { AudioPlayer, AudioResource } from '@discordjs/voice';
import { MessageEmbed, TextChannel } from 'discord.js';

import { AudioResourceWithTrack, ValidMessage } from '../../types/discord';
import { Callback, EndRoundReason } from '../../types/game';
import { Track } from '../../types/tracks';

import Guesses from '../guesses/guesses';

export default class Round {
  audioPlayer: AudioPlayer;
  textChannel: TextChannel;
  track: Track;
  audioResource: AudioResourceWithTrack;
  guesses: Guesses;
  timer: NodeJS.Timeout;
  timeLimit: number;
  callback: Callback;

  constructor(audioResource: AudioResourceWithTrack, audioPlayer: AudioPlayer, textChannel: TextChannel,
    timeLimit: number, callback: Callback) {
    this.audioPlayer = audioPlayer;
    this.textChannel = textChannel;

    this.audioResource = audioResource;
    this.track = this.audioResource.metadata;

    this.guesses = new Guesses(this.track);

    this.callback = callback;
    this.timeLimit = timeLimit;
    this.timer = setTimeout(() => {
      this.endRound('timeout');
    }, this.timeLimit * 1000);
  }

  startRound() {
    // Start playing audio resource
    try {
      // TODO assuming that the connection is already subscriebd to the audio resource
      this.audioPlayer.play(this.audioResource as AudioResource);

      this.audioPlayer.on('error', (err: Error) => {
        console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists, err);
        return this.endRound('loadfail');
      });
    } catch (err) {
      console.error(
        `#${this.textChannel.name}:`,
        '[ERROR NOT HANDLED PROPERLY] - Cannot play',
        this.track.name,
        this.track.artists,
        err,
      );
      return this.endRound('loadfail');
    }
  }

  checkGuess(message: ValidMessage) {
    const guessCorrect = this.guesses.checkGuess(message);
    if (guessCorrect && this.guesses.guessedAll()) {
      this.endRound('correct');
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

  endRound(reason: EndRoundReason, callback?: Callback) {
    clearTimeout(this.timer);

    if (callback) {
      callback(reason);
    }
  }
}

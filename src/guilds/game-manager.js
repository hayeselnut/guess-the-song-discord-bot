/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';
import Game from './game/game.js';

export default class GameManager {
  constructor(game, config) {
    this.game = game;

    this.prefix = config.prefix;
    this.round_duration = config.round_duration;
    this.emote_nearly_correct_guesses = config.emote_nearly_correct_guesses;
    this.leaderboard = new Map(Object.entries(config.leaderboard));
  }

  updatePrefix(prefix) {
    this.prefix = prefix;
    // TODO UPDATE FIREBASE:
  }

  updateRoundDuration(duration) {
    this.round_duration = duration;
    // TODO UPDATE FIREBASE
  }

  updateEmote(emote) {
    this.emote_nearly_correct_guesses = emote;
    // TODO update fireabse
  }

  updateLeaderboard(winner, players) {
    this.leaderboard.set(winner, (this.leaderboard.get(winner) || 0) + 1);

    players.forEach((player) => {
      if (!this.leaderboard.has(player)) {
        this.leaderboard.set(player, 0);
      }
    });

    // TODO UPDATE FIREBASE
  }

  clearGame() {
    this.game.endGame(false);
    this.game = null;
  }

  initializeGame(message, name, img, tracks, roundLimit) {
    const tracksLength = Object.keys(tracks).length;
    const playlistEmbed = new MessageEmbed()
      .setTitle(name)
      .setDescription(`Loading ${tracksLength} songs...`)
      .setImage(img);
    message.channel.send({ embed: playlistEmbed });

    const game = new Game(message, tracks, Math.min(tracksLength, roundLimit), () => {
      this.game = null;
    });
    this.game = game;
    game.startGame();
  }

  getConfig() {
    return {
      prefix: this.prefix,
      round_duration: this.round_duration,
      emote_nearly_correct_guesses: this.emote_nearly_correct_guesses,
      leaderboard: this.leaderboard,
    };
  }
}

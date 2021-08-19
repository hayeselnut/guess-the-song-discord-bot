/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';
import { sendEmbed } from '../helpers/discord-helpers.js';
import { parseRoundDuration } from '../helpers/helpers.js';
import Game from './game/game.js';

export default class GameManager {
  constructor(game, guildId, config) {
    this.game = game;
    this.guildId = guildId;
    this.prefix = config.prefix;
    this.roundDuration = config.round_duration;
    this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
    this.leaderboard = config.leaderboard;
  }

  updatePrefix(prefix, message, db) {
    const newPrefix = String(prefix);
    sendEmbed(message.channel, `Prefix has been set to \`${newPrefix}\``);
    this.prefix = newPrefix;
    this._updateDatabase(db);
  }

  updateRoundDuration(duration, message, db) {
    const newRoundDuration = parseRoundDuration(duration);
    if (isNaN(newRoundDuration)) {
      return sendEmbed(message.channel, 'Round duration limit must be a number');
    }
    sendEmbed(message.channel, `Round duration limit has been set to ${newRoundDuration} seconds`);
    this.roundDuration = newRoundDuration;
    this._updateDatabase(db);
  }

  // updateEmote(emote) {
  //   this.emoteNearlyCorrectGuesses = emote;
  // }

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
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
    };
  }

  loadConfig() {
    this.prefix = prefix;
  }

  _updateDatabase(db) {
    db.collection('guilds').doc(this.guildId).set({
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
      leaderboard: this.leaderboard,
    });
  }
}

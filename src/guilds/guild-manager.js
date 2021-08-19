/* eslint-disable require-jsdoc */
import DefaultConfig from '../assets/default-config.json';
import { sendEmbed } from '../helpers/discord-helpers.js';
import GameManager from './game-manager.js';

export default class GuildManager {
  constructor(db) {
    this.guilds = new Map(); // <GUILD_ID, GAME_MANAGER>
    this.db = db;

    this._loadGuilds();
  }

  async _loadGuilds() {
    const snapshot = await this.db.collection('guilds').get();
    snapshot.forEach((doc) => {
      this.guilds.set(doc.id, new GameManager(null, doc.id, doc.data()));
    });
  };

  hasActiveGameInGuild(guildId) {
    return this.guilds.get(guildId)?.game !== null;
  }

  hasActiveGame(guildId, channelId) {
    const game = this.guilds.get(guildId).game;
    return game
      ? game.textChannel.id === channelId
      : false;
  }

  // Will only check guess if the game is running and the message was sent
  // into the same channel the game is in.
  checkGuess(message) {
    const game = this._getGame(message.guild.id, message.channel.id);
    game?.checkGuess(message);
  }

  finishGame(guildId) {
    const gameManager = this.guilds.get(guildId);
    if (!gameManager || !gameManager?.game) return;

    gameManager.clearGame();
  }

  initializeGame(message, name, img, tracks, roundLimit) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager.initializeGame(message, name, img, tracks, roundLimit);
  }

  getConfig(guildId) {
    const gameManager = this._getGameManager(guildId);
    return gameManager.getConfig();
  }

  skipRound(guildId, channelId) {
    const game = this._getGame(guildId, channelId);
    game?.skipRound();
  }

  updatePrefix(prefix, message) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager.updatePrefix(prefix, message, this.db);
  }

  updateRoundDuration(duration, message) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager.updateRoundDuration(duration, message, this.db);
  }

  // updateEmote(emote) {

  // }

  resetConfig(message) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager.prefix = DefaultConfig.prefix;
    gameManager.roundDuration = DefaultConfig.round_duration;
    gameManager.emoteNearlyCorrectGuesses = DefaultConfig.emote_nearly_correct_guesses;

    this.db.collection('guilds').doc(message.guild.id).set({
      prefix: DefaultConfig.prefix,
      round_duration: DefaultConfig.round_duration,
      emote_nearly_correct_guesses: DefaultConfig.emote_nearly_correct_guesses,
    }, { merge: true });
    sendEmbed(message.channel, 'Configs have been reset');
  }

  _getGame(guildId, channelId) {
    const game = this.guilds.get(guildId)?.game;
    return game?.textChannel?.id === channelId ? game : undefined;
  }

  _getGameManager(guildId) {
    this._initializeNewGuild(guildId);
    return this.guilds.get(guildId);
  }

  _initializeNewGuild(guildId) {
    if (this.guilds.has(guildId)) return;

    const gameManager = new GameManager(null, guildId, DefaultConfig);
    this.guilds.set(guildId, gameManager);

    // Upload to database
    this.db.collection('guilds').doc(guildId).set(DefaultConfig);
  }
}

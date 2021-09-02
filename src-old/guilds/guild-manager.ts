import { firestore } from 'firebase-admin';
import DefaultConfig from '../assets/default-config.json';
import { sendEmbed } from '../helpers/discord-helpers.js';
import { Config, Tracks, ValidMessage, ValidMessageWithVoiceChannel } from '../types';
import GameManager from './game-manager.js';

export default class GuildManager {
  guilds: Map<string, GameManager>;
  db: firestore.Firestore;

  constructor(db: firestore.Firestore) {
    this.guilds = new Map(); // <GUILD_ID, GAME_MANAGER>
    this.db = db;

    this._loadGuilds();
  }

  async _loadGuilds() {
    const snapshot = await this.db.collection('guilds').get();
    snapshot.forEach((doc) => {
      this.guilds.set(doc.id, new GameManager(this.db, null, doc.id, doc.data() as Config));
    });
  };

  hasActiveGameInGuild(guildId: string) {
    return this.guilds.get(guildId)?.game !== null;
  }

  hasActiveGame(guildId: string, channelId: string) {
    const game = this.guilds.get(guildId)?.game;
    return game
      ? game.textChannel.id === channelId
      : false;
  }

  // Will only check guess if the game is running and the message was sent
  // into the same channel the game is in.
  checkGuess(message: ValidMessage) {
    const game = this._getGame(message.guild.id, message.channel.id);
    game?.checkGuess(message);
  }

  finishGame(guildId: string) {
    const gameManager = this.guilds.get(guildId);
    if (!gameManager || !gameManager?.game) return;

    gameManager.clearGame();
  }

  initializeGame(message: ValidMessageWithVoiceChannel, name: string, img: string | undefined, tracks: Tracks, roundLimit: number) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager?.initializeGame(message, name, img, tracks, roundLimit);
  }

  getConfig(guildId: string) {
    const gameManager = this._getGameManager(guildId);
    return gameManager?.getConfig() || DefaultConfig;
  }

  getLeaderboard(guildId: string) {
    const gameManager = this._getGameManager(guildId);
    return gameManager?.getLeaderboard();
  }

  skipRound(guildId: string, channelId: string) {
    const game = this._getGame(guildId, channelId);
    game?.skipRound();
  }

  updatePrefix(prefix: string, message: ValidMessage) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager?.updatePrefix(prefix, message);
  }

  updateRoundDuration(duration: string, message: ValidMessage) {
    const gameManager = this._getGameManager(message.guild.id);
    gameManager?.updateRoundDuration(duration, message);
  }

  // updateEmote(emote) {

  // }

  resetConfig(message: ValidMessage) {
    const gameManager = this._getGameManager(message.guild.id);
    if (!gameManager) return;

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

  _getGame(guildId: string, channelId: string) {
    const game = this.guilds.get(guildId)?.game;
    return game?.textChannel?.id === channelId ? game : undefined;
  }

  _getGameManager(guildId: string) {
    this._initializeNewGuild(guildId);
    return this.guilds.get(guildId);
  }

  _initializeNewGuild(guildId: string) {
    if (this.guilds.has(guildId)) return;

    const gameManager = new GameManager(this.db, null, guildId, { ...DefaultConfig, leaderboard: {} });
    this.guilds.set(guildId, gameManager);

    // Upload to database
    this.db.collection('guilds').doc(guildId).set({ ...DefaultConfig, leaderboard: {} });
  }
}

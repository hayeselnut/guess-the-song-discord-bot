"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
const discord_helpers_js_1 = require("../helpers/discord-helpers.js");
const game_manager_js_1 = __importDefault(require("./game-manager.js"));
class GuildManager {
    constructor(db) {
        this.guilds = new Map(); // <GUILD_ID, GAME_MANAGER>
        this.db = db;
        this._loadGuilds();
    }
    async _loadGuilds() {
        const snapshot = await this.db.collection('guilds').get();
        snapshot.forEach((doc) => {
            this.guilds.set(doc.id, new game_manager_js_1.default(this.db, null, doc.id, doc.data()));
        });
    }
    ;
    hasActiveGameInGuild(guildId) {
        return this.guilds.get(guildId)?.game !== null;
    }
    hasActiveGame(guildId, channelId) {
        const game = this.guilds.get(guildId)?.game;
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
        if (!gameManager || !gameManager?.game)
            return;
        gameManager.clearGame();
    }
    initializeGame(message, name, img, tracks, roundLimit) {
        const gameManager = this._getGameManager(message.guild.id);
        gameManager?.initializeGame(message, name, img, tracks, roundLimit);
    }
    getConfig(guildId) {
        const gameManager = this._getGameManager(guildId);
        return gameManager?.getConfig() || default_config_json_1.default;
    }
    getLeaderboard(guildId) {
        const gameManager = this._getGameManager(guildId);
        return gameManager?.getLeaderboard();
    }
    skipRound(guildId, channelId) {
        const game = this._getGame(guildId, channelId);
        game?.skipRound();
    }
    updatePrefix(prefix, message) {
        const gameManager = this._getGameManager(message.guild.id);
        gameManager?.updatePrefix(prefix, message);
    }
    updateRoundDuration(duration, message) {
        const gameManager = this._getGameManager(message.guild.id);
        gameManager?.updateRoundDuration(duration, message);
    }
    // updateEmote(emote) {
    // }
    resetConfig(message) {
        const gameManager = this._getGameManager(message.guild.id);
        if (!gameManager)
            return;
        gameManager.prefix = default_config_json_1.default.prefix;
        gameManager.roundDuration = default_config_json_1.default.round_duration;
        gameManager.emoteNearlyCorrectGuesses = default_config_json_1.default.emote_nearly_correct_guesses;
        this.db.collection('guilds').doc(message.guild.id).set({
            prefix: default_config_json_1.default.prefix,
            round_duration: default_config_json_1.default.round_duration,
            emote_nearly_correct_guesses: default_config_json_1.default.emote_nearly_correct_guesses,
        }, { merge: true });
        discord_helpers_js_1.sendEmbed(message.channel, 'Configs have been reset');
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
        if (this.guilds.has(guildId))
            return;
        const gameManager = new game_manager_js_1.default(this.db, null, guildId, { ...default_config_json_1.default, leaderboard: {} });
        this.guilds.set(guildId, gameManager);
        // Upload to database
        this.db.collection('guilds').doc(guildId).set({ ...default_config_json_1.default, leaderboard: {} });
    }
}
exports.default = GuildManager;

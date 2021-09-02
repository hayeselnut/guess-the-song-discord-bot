"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discord_helpers_js_1 = require("../helpers/discord-helpers.js");
const helpers_js_1 = require("../helpers/helpers.js");
const game_js_1 = __importDefault(require("./game/game.js"));
class GameManager {
    constructor(db, game, guildId, config) {
        this.db = db;
        this.game = game;
        this.guildId = guildId;
        // These states will always be synced with database
        this.prefix = config.prefix;
        this.roundDuration = config.round_duration;
        this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
        this.leaderboard = config.leaderboard;
    }
    updatePrefix(prefix, message) {
        const newPrefix = String(prefix);
        (0, discord_helpers_js_1.sendEmbed)(message.channel, `Prefix has been set to \`${newPrefix}\``);
        this.prefix = newPrefix;
        this._updateDatabase();
    }
    updateRoundDuration(duration, message) {
        const newRoundDuration = (0, helpers_js_1.parseRoundDuration)(duration);
        if (isNaN(newRoundDuration)) {
            return (0, discord_helpers_js_1.sendEmbed)(message.channel, 'Round duration limit must be a number');
        }
        (0, discord_helpers_js_1.sendEmbed)(message.channel, `Round duration limit has been set to ${newRoundDuration} seconds`);
        this.roundDuration = newRoundDuration;
        this._updateDatabase();
    }
    // updateEmote(emote) {
    //   this.emoteNearlyCorrectGuesses = emote;
    // }
    updateLeaderboard(game) {
        const players = game.leaderboard.getPlayers();
        if (!players.length)
            return;
        players.forEach((player) => {
            if (!(player in this.leaderboard)) {
                this.leaderboard[player] = 0;
            }
        });
        const winners = game.leaderboard.getWinners();
        winners.forEach((winner) => {
            this.leaderboard[winner]++;
        });
        // Update database
        this.db.collection('guilds').doc(this.guildId).set({
            leaderboard: this.leaderboard,
        }, { merge: true });
    }
    clearGame() {
        if (!this.game)
            return;
        this.game.endGame(false);
        this.updateLeaderboard(this.game);
        this.game = null;
    }
    initializeGame(message, name, img, tracks, roundLimit) {
        const tracksLength = Object.keys(tracks).length;
        const newRoundLimit = Math.min(tracksLength, roundLimit);
        const playlistEmbed = new discord_js_1.MessageEmbed()
            .setTitle(name)
            .setDescription(`Loading ${newRoundLimit} songs...`)
            .setImage(img ?? '');
        message.channel.send({ embeds: [playlistEmbed] });
        console.log(`Initializing game of ${newRoundLimit} rounds in GUILD ${message.guild.name}`);
        const game = new game_js_1.default(message, tracks, newRoundLimit, this.roundDuration, () => {
            if (this.game) {
                this.updateLeaderboard(this.game);
            }
            this.game = null;
        });
        this.game = game;
        game.startGame();
    }
    getLeaderboard() {
        return this.leaderboard;
    }
    getConfig() {
        return {
            prefix: this.prefix,
            round_duration: this.roundDuration,
            emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
        };
    }
    _updateDatabase() {
        this.db.collection('guilds').doc(this.guildId).set({
            prefix: this.prefix,
            round_duration: this.roundDuration,
            emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
            leaderboard: this.leaderboard,
        });
    }
}
exports.default = GameManager;

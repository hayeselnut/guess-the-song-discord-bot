"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = __importDefault(require("../client/client"));
const spotify_1 = __importDefault(require("../spotify/spotify"));
const game_1 = __importDefault(require("../game/game"));
const leaderboard_1 = __importDefault(require("../leaderboard/leaderboard"));
const bot_helpers_1 = require("../helpers/bot-helpers");
const game_helpers_1 = require("../helpers/game-helpers");
const help_json_1 = __importDefault(require("../assets/help.json"));
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
// Responsible for maintaining Guild state and parsing messages
class Guild {
    constructor(config = default_config_json_1.default, leaderboard = {}) {
        this.config = config;
        this.game = null;
        this.leaderboard = new leaderboard_1.default(leaderboard);
    }
    readMessage(message) {
        if (message.content.startsWith(this.config.prefix)) {
            this._readCommand(message);
        }
        // Mentioning the bot shows the help menu
        if (message.mentions.has(client_1.default.user.id)) {
            this._help(message);
        }
        // Check guess if the game exists
        this.game?.checkGuess(message);
    }
    async _readCommand(message) {
        try {
            if (message.content.startsWith(`${this.config.prefix}start`)) {
                // Must await to catch the error thrown
                await this._startGame(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}stop`)) {
                this._stopGame(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}skip`)) {
                this._skipRound(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}leaderboard`)) {
                this._showLeaderboard(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}config`)) {
                this._showConfig(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}help`)) {
                this._help(message);
            }
            else {
                throw new Error(`Invalid command. Use \`${this.config.prefix}help\` for a list of commands.`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, bot_helpers_1.sendEmbed)(message.channel, `⚠: ${error.message}`);
            }
            console.error('ERROR reading command', error);
        }
    }
    async _startGame(message) {
        if (this.game)
            throw new Error(`There's already a game running!`);
        const args = (0, bot_helpers_1.parseMessage)(message);
        const { roundLimit, playlistLinks } = (0, game_helpers_1.parseStartGameArgs)(args, this.config.prefix);
        if (!(0, bot_helpers_1.isValidMessageWithVoice)(message)) {
            throw new Error('You need to be in a voice channel to play music');
        }
        (0, game_helpers_1.throwIfInsufficientVoicePermissions)(message);
        // Initialize game
        const { name, img, tracks } = await spotify_1.default.getPlaylists(playlistLinks);
        const tracksLength = Object.keys(tracks).length;
        const newRoundLimit = Math.min(tracksLength, roundLimit);
        const playlistEmbed = new discord_js_1.MessageEmbed()
            .setTitle(name)
            .setDescription(`Loading ${newRoundLimit} songs...`)
            .setImage(img ?? '');
        message.channel.send({ embeds: [playlistEmbed] });
        console.log(`${message.guild.name} - #${message.channel.name}: Initializing game of ${newRoundLimit} rounds`);
        this.game = new game_1.default(message, this.config, newRoundLimit, tracks, (reason) => this._endGameCallback(reason));
        this.game.startGame();
    }
    _stopGame(message) {
        if (!this.game)
            throw new Error('Nothing to stop here!');
        if (this.game.host !== message.member.toString()) {
            throw new Error(`Only the host ${this.game.host} can stop a game.`);
        }
        this.game.endGame('FORCE_STOP');
    }
    _skipRound(message) {
        if (!this.game)
            throw new Error('Nothing to skip here!');
        if (this.game.host !== message.member.toString()) {
            throw new Error(`Only the host ${this.game.host} can skip rounds.`);
        }
        this.game.skipRound();
    }
    _endGameCallback(reason) {
        if (this.game) {
            this.leaderboard.mergeAndIncrementWinners(this.game.leaderboard);
        }
        this.game = null;
    }
    _showLeaderboard(message) {
        (0, bot_helpers_1.sendEmbed)(message.channel, this.leaderboard.toString());
    }
    _showConfig(message) {
        (0, bot_helpers_1.sendEmbed)(message.channel, JSON.stringify(this.config));
    }
    _help(message) {
        const helpEmbed = new discord_js_1.MessageEmbed()
            .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
            .setDescription(help_json_1.default.description)
            .addFields(Object.entries(help_json_1.default.commands).map(([name, cmd]) => ({
            name: `${cmd.emoji} ${name}`,
            value: `\`${this.config.prefix}${cmd.usage}\`: ${cmd.description}`,
        })));
        message.channel.send({ embeds: [helpEmbed] });
    }
    ;
}
exports.default = Guild;

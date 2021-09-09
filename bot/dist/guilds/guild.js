"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = __importDefault(require("../client/client"));
const spotify_1 = __importDefault(require("../spotify/spotify"));
const game_1 = __importDefault(require("../game/game"));
const db_1 = __importDefault(require("../db/db"));
const leaderboard_1 = __importDefault(require("../leaderboard/leaderboard"));
const bot_helpers_1 = require("../helpers/bot-helpers");
const game_helpers_1 = require("../helpers/game-helpers");
const help_json_1 = __importDefault(require("../assets/help.json"));
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
// Responsible for maintaining Guild state and parsing messages
class Guild {
    constructor(guildId, config = default_config_json_1.default, points = {}) {
        this.guildId = guildId;
        this.config = config;
        this.game = null;
        this.leaderboard = new leaderboard_1.default(points);
    }
    readMessage(message) {
        if (message.content.startsWith(this.config.prefix)) {
            this.readCommand(message);
        }
        // Mentioning the bot shows the help menu
        if (message.mentions.has(client_1.default.user.id)) {
            this.showHelp(message);
        }
        // Check guess if the game exists
        this.game?.checkGuess(message);
    }
    async readCommand(message) {
        try {
            if (message.content.startsWith(`${this.config.prefix}start`)) {
                // Must await to catch the error thrown
                await this.startGame(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}stop`)) {
                this.stopGame(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}skip`)) {
                this.skipRound(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}leaderboard`)) {
                this.showLeaderboard(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}config`)) {
                this.showConfig(message);
            }
            else if (message.content.startsWith(`${this.config.prefix}help`)) {
                this.showHelp(message);
            }
            else {
                throw new Error(`Invalid command. Use \`${this.config.prefix}help\` for a list of commands.`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                return (0, bot_helpers_1.sendEmbed)(message.channel, `⚠: ${error.message}`);
            }
            console.error('ERROR reading command', message.content, error);
        }
    }
    async startGame(message) {
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
        // Create arrow function to preserve 'this' context
        const endGameCallback = (reason) => this.endGameCallback(reason);
        this.game = new game_1.default(message, this.config, newRoundLimit, tracks, endGameCallback);
        this.game.startGame();
    }
    stopGame(message) {
        if (!this.game)
            throw new Error('Nothing to stop here!');
        if (this.game.host !== message.member.toString()) {
            throw new Error(`Only the host ${this.game.host} can stop a game.`);
        }
        this.game.endGame('FORCE_STOP');
    }
    skipRound(message) {
        if (!this.game)
            throw new Error('Nothing to skip here!');
        if (this.game.host !== message.member.toString()) {
            throw new Error(`Only the host ${this.game.host} can skip rounds.`);
        }
        this.game.skipRound();
    }
    endGameCallback(reason) {
        if (this.game) {
            this.leaderboard.mergeAndIncrementWinners(this.game.leaderboard);
        }
        this.game = null;
        // Update database
        db_1.default.collection('guilds').doc(this.guildId).set({
            leaderboard: this.leaderboard.points,
        }, { merge: true });
    }
    showLeaderboard(message) {
        (0, bot_helpers_1.sendEmbed)(message.channel, this.leaderboard.toString());
    }
    showConfig(message) {
        // TODO allow setting of configs
        (0, bot_helpers_1.sendEmbed)(message.channel, JSON.stringify(this.config));
    }
    showHelp(message) {
        const helpEmbed = new discord_js_1.MessageEmbed()
            .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
            .setDescription(help_json_1.default.description)
            .addFields(Object.entries(help_json_1.default.commands).map(([name, cmd]) => ({
            name: `${cmd.emoji} ${name}`,
            value: `
            \`${this.config.prefix}${cmd.usage}\`: ${cmd.description}

            Example: \`${this.config.prefix}${cmd.example}\`
          `,
        })));
        message.channel.send({ embeds: [helpEmbed] });
    }
    ;
}
exports.default = Guild;

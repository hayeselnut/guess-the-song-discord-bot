"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const bot_helpers_1 = require("../helpers/bot-helpers");
const audio_resource_buffer_1 = __importDefault(require("./audio-resource-buffer"));
const leaderboard_1 = __importDefault(require("../leaderboard/leaderboard"));
const round_1 = __importDefault(require("./round"));
class Game {
    constructor(message, config, tracks, callback) {
        this.starterId = message.member.id;
        this.timeLimit = config.round_duration;
        this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
        this.tracks = tracks;
        this.guildId = message.guild.id;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        // Game state
        this.currRound = 0;
        this.finished = false;
        this.leaderboard = new leaderboard_1.default();
        this.buffer = new audio_resource_buffer_1.default(this.tracks, this.timeLimit);
        // Round state
        this.round = null;
        this.callback = callback;
        this.audioPlayer = (0, voice_1.createAudioPlayer)();
        this.connection = (0, voice_1.joinVoiceChannel)({
            channelId: this.voiceChannel.id,
            guildId: this.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });
        this.connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                    (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            }
            catch (error) {
                // Manually disconnecting the bot will continue running the game (even shows it in the discord channel)
                // BUG: where if you then $stop it will throw error because cannot destroy a voice connection already destroyed
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.connection.destroy();
                this.endGame('DISCONNECTED');
            }
        });
        this.connection.subscribe(this.audioPlayer);
    }
    checkGuess(message) {
        this.round?.checkGuess(message);
    }
    async startGame() {
        // Wait for buffer to load before starting rounds
        await this.buffer.initializeBuffer();
        this._startRound();
    }
    endGame(reason, callback) {
        this.finished = true;
        console.log(`#${this.textChannel.name}: Game ended with reason ${reason}`);
        this.round = null;
        // TODO should check if connection is already destroyed
        this.connection.destroy();
        const gameSummary = new discord_js_1.MessageEmbed()
            .setTitle('🏁 Final Leaderboard')
            .setColor('BLUE')
            .setDescription(this.leaderboard.toString());
        this.textChannel.send({ embeds: [gameSummary] });
        if (callback) {
            callback(reason);
        }
    }
    // TODO: implement skipRound()
    skipRound() {
        console.log('Skip game');
        console.log('only starter id can skip!');
    }
    _startRound() {
        if (this.finished || this.currRound >= this.timeLimit) {
            return this.endGame('ALL_ROUNDS_PLAYED');
        }
        const audioResource = this.buffer.getNextAudioResourceAndUpdateBuffer();
        if (!audioResource) {
            // TODO handle audio resource is undefined
            return;
        }
        this.round = new round_1.default(audioResource, this.audioPlayer, this.textChannel, this.timeLimit, (reason) => this._endRoundCallback(reason));
        this.round.startRound();
        (0, bot_helpers_1.sendEmbed)(this.textChannel, `[${this.currRound + 1}/${this.timeLimit}] Starting next song...`);
    }
    _endRoundCallback(reason) {
        const title = reason === 'CORRECT' ? 'Round summary'
            : reason === 'TIMEOUT' ? 'Too slow! Skipping song...'
                : reason === 'FORCE_SKIP' ? 'Skipping round...'
                    // reason === 'LOAD_FAIL'
                    : 'Could not load song. Skipping song...';
        if (this.round) {
            this.leaderboard.update(this.round.guesses);
            const roundSummary = new discord_js_1.MessageEmbed()
                .setTitle(`[${this.currRound + 1}/${this.timeLimit}] ${title}`)
                .setColor(reason === 'CORRECT' ? 'GREEN' : 'RED')
                .setDescription(this.round.guesses.toResultString())
                .setThumbnail(this.round.track.img)
                .addField('\u200B', '\u200B')
                .addField('🏆 Leaderboard', this.leaderboard.toString());
            this.textChannel.send({ embeds: [roundSummary] });
        }
        this.currRound++;
        this._startRound();
    }
}
exports.default = Game;

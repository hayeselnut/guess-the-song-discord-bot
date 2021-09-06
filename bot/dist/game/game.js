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
    constructor(message, config, roundLimit, tracks, callback) {
        this.host = message.member.toString();
        this.timeLimit = config.round_duration;
        this.roundLimit = roundLimit;
        this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
        this.tracks = tracks;
        this.guildId = message.guild.id;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        // Game state
        this.currRound = 0;
        this.finished = false;
        this.leaderboard = new leaderboard_1.default();
        this.buffer = new audio_resource_buffer_1.default(this.tracks, this.roundLimit);
        // Round state
        this.round = null;
        this.callback = callback;
        this.audioPlayer = (0, voice_1.createAudioPlayer)()
            .on('error', (error) => {
            console.error(`⚠ ERROR with resource ${error.resource.metadata.name}`, error.message);
            this.round?.endRound('LOAD_FAIL');
        });
        this.connectToVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });
    }
    checkGuess(message) {
        this.round?.checkGuess(message);
    }
    async startGame() {
        // Wait for buffer to load before starting rounds
        await this.buffer.initializeBuffer();
        this._startRound();
    }
    endGame(reason) {
        this.finished = true;
        this.round = null;
        const connection = (0, voice_1.getVoiceConnection)(this.guildId);
        connection?.destroy();
        console.log(`#${this.textChannel.name}: Game ended with reason ${reason}`);
        const gameSummary = new discord_js_1.MessageEmbed()
            .setTitle('🏁 Final Leaderboard')
            .setColor('BLUE')
            .setDescription(this.leaderboard.toString());
        this.textChannel.send({ embeds: [gameSummary] });
        this.callback(reason);
    }
    skipRound() {
        this.round?.endRound('FORCE_SKIP');
    }
    _startRound() {
        if (this.finished || this.currRound >= this.roundLimit) {
            return this.endGame('ALL_ROUNDS_PLAYED');
        }
        const audioResource = this.buffer.getNextAudioResourceAndUpdateBuffer();
        if (!audioResource) {
            console.log('// TODO audio resource is undefined');
            return;
        }
        this.round = new round_1.default(audioResource, this.audioPlayer, this.textChannel, this.timeLimit, (reason) => this._endRoundCallback(reason));
        this.round.startRound();
        (0, bot_helpers_1.sendEmbed)(this.textChannel, `[${this.currRound + 1}/${this.roundLimit}] Starting next song...`);
        console.log(`#${this.textChannel.name} [${this.currRound + 1}/${this.roundLimit}]:`, this.round.track.name, this.round.track.artists);
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
                .setTitle(`[${this.currRound + 1}/${this.roundLimit}] ${title}`)
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
    connectToVoiceChannel(options) {
        const connection = (0, voice_1.joinVoiceChannel)(options)
            .on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
            console.log('Entered disconnected state');
            try {
                await Promise.race([
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
                console.log('Reconnection detected');
            }
            catch (error) {
                // Manually disconnecting the bot will continue running the game (even shows it in the discord channel)
                // BUG: where if you then $stop it will throw error because cannot destroy a voice connection already destroyed
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                console.log('Never reconnected, destroying connection...');
                connection.destroy();
                this.endGame('DISCONNECTED');
            }
        });
        connection.subscribe(this.audioPlayer);
    }
}
exports.default = Game;

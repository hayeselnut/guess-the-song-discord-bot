"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const yt_search_1 = __importDefault(require("yt-search"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const discord_helpers_js_1 = require("../../helpers/discord-helpers.js");
const helpers_js_1 = require("../../helpers/helpers.js");
const leaderboard_js_1 = __importDefault(require("./leaderboard.js"));
const round_js_1 = __importDefault(require("./round.js"));
const cookie_json_1 = __importDefault(require("../../assets/cookie.json"));
const voice_1 = require("@discordjs/voice");
const BUFFER_LIMIT = 5;
class Game {
    constructor(message, tracks, roundLimit, roundDuration, callback) {
        // Discord things
        this.guildId = message.guild.id;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        this.connection = (0, voice_1.joinVoiceChannel)({
            channelId: this.voiceChannel.id,
            guildId: this.guildId,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });
        this.audioPlayer = (0, voice_1.createAudioPlayer)();
        this.connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                    (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            }
            catch (error) {
                console.log('SHOULD END GAME HERE! //TODO');
                // Manually disconnecting the bot will continue running the game (even shows it in the discord channel)
                // BUG: where if you then $stop it will throw error because cannot destroy a voice connection already destroyed
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.connection.destroy();
            }
        });
        this.connection.subscribe(this.audioPlayer);
        // Game
        this.tracks = tracks;
        this.roundDuration = roundDuration;
        this.roundLimit = roundLimit;
        this.order = (0, helpers_js_1.shuffle)(Object.keys(tracks)).slice(0, this.roundLimit);
        this.leaderboard = new leaderboard_js_1.default();
        // Round buffers (this helps the discord bot play a song instantly instead of waiting for await to finish)
        this.nextRounds = []; // Buffer of next rounds containing preloaded streams
        // Round things
        this.round = null;
        this.currRound = 0;
        this.callback = callback;
    }
    async startGame() {
        console.log(`#${this.textChannel.name}: Starting game of ${this.roundLimit} rounds...`);
        // await this._connectToVoiceChannel(); // TODO delete
        // Load buffer of next 3 streams
        for (let i = 0; i < Math.min(BUFFER_LIMIT, this.roundLimit); i++) {
            await this._loadBufferRound(i);
        }
        this._startRound();
    }
    checkGuess(message) {
        if (this.round == null) {
            return console.error('Could not check guess with empty round');
        }
        ;
        this.round.checkGuess(message);
    }
    async _loadBufferRound(index) {
        const trackId = this.order[index];
        if (!trackId) {
            return console.warn('Tried to buffer more rounds than required');
        }
        ;
        const track = this.tracks[trackId];
        const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
        const youtubeResults = await (0, yt_search_1.default)(youtubeQuery);
        const video = youtubeResults.videos[0];
        const stream = (0, ytdl_core_1.default)(video.url, {
            filter: 'audioonly',
            requestOptions: {
                headers: cookie_json_1.default,
            },
        }).on('error', (err) => {
            console.error(err);
            // If error, we set the stream to null so that it is invalid in the round and the round is skipped.
            for (let i = 0; i < this.nextRounds.length; i++) {
                if (trackId != this.nextRounds[i].track.id)
                    continue;
                this.nextRounds[i].stream = null;
            }
        });
        // const audioResource = createAudioResource(stream);
        if (!this.connection) {
            this._failJoinVoiceChannel();
            return;
        }
        const round = new round_js_1.default(track, stream, this.audioPlayer, this.textChannel, this.roundDuration, (title) => {
            this._endRound(title);
        });
        this.nextRounds.push(round);
    }
    _startRound() {
        if (this.currRound >= this.roundLimit) {
            return this.endGame();
        }
        this.round = this.nextRounds.shift();
        if (!this.round) {
            console.error('Could not load round from empty buffer');
            (0, discord_helpers_js_1.sendEmbed)(this.textChannel, 'Could not load round from empty buffer');
            return;
        }
        (0, discord_helpers_js_1.sendEmbed)(this.textChannel, `[${this.currRound + 1}/${this.roundLimit}] Starting next song...`);
        console.log(`#${this.textChannel.name} [${this.currRound + 1}/${this.roundLimit}]:`, this.round.track.name, this.round.track.artists);
        this.connection.subscribe(this.audioPlayer);
        this.round.startRound();
    }
    // This function is provided as a callback to the round.
    _endRound(title = 'Round summary') {
        // Load next buffer round if possible
        if (this.currRound + BUFFER_LIMIT < this.roundLimit) {
            this._loadBufferRound(this.currRound + BUFFER_LIMIT);
        }
        if (this.round) {
            // Display round results and current leaderboard
            this.leaderboard.update(this.round.guesses);
            const roundSummary = new discord_js_1.MessageEmbed()
                .setTitle(`[${this.currRound + 1}/${this.roundLimit}] ${title}`)
                .setColor(title === 'Round summary' ? 'GREEN' : 'RED')
                .setDescription(this.round.guesses.toString(true))
                .setThumbnail(this.round.track?.img)
                .addField('\u200B', '\u200B')
                .addField('🏆 Leaderboard', this.leaderboard.toString());
            this.textChannel.send({ embeds: [roundSummary] });
        }
        this.currRound++;
        this._startRound();
    }
    skipRound() {
        this.round?.endRound(false);
        this._endRound('Skipping round...');
    }
    // async _connectToVoiceChannel() {
    //   try {
    //     this.connection = await this.voiceChannel.join();
    //   } catch (err) {
    //     console.error(err);
    //     this._failJoinVoiceChannel();
    //   }
    // }
    _failJoinVoiceChannel() {
        (0, discord_helpers_js_1.sendEmbed)(this.textChannel, 'Could not join voice channel 😞');
        this.connection.destroy();
        this.endGame();
    }
    endGame(useCallback = true) {
        console.log(`#${this.textChannel.name}: Game ended ${useCallback ? 'naturally' : 'manually'}`);
        this.currRound = this.roundLimit;
        this.round?.endRound(false);
        this.round = null;
        this.connection.destroy();
        const gameSummary = new discord_js_1.MessageEmbed()
            .setTitle('🏁 Final Leaderboard')
            .setColor('BLUE')
            .setDescription(this.leaderboard.toString());
        this.textChannel.send({ embeds: [gameSummary] });
        if (!useCallback)
            return;
        this.callback();
    }
}
exports.default = Game;
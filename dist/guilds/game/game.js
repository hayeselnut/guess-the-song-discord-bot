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
const BUFFER_LIMIT = 5;
class Game {
    constructor(message, tracks, roundLimit, roundDuration, callback) {
        // Discord things
        this.guildId = message.guild.id;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        this.connection = null;
        // Game
        this.tracks = tracks;
        this.roundDuration = roundDuration;
        this.roundLimit = roundLimit;
        this.order = helpers_js_1.shuffle(Object.keys(tracks)).slice(0, this.roundLimit);
        this.paused = false;
        this.leaderboard = new leaderboard_js_1.default();
        // Round buffers (this helps the discord bot play a song instantly instead of waiting for await to finish)
        this.nextRounds = []; // Buffer of next rounds containing preloaded streams
        // Round things
        this.round = null;
        this.currRound = 0;
        this.callback = callback;
    }
    async startGame() {
        console.log(`#${this.textChannel.name}: Starting game`);
        await this._connectToVoiceChannel();
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
        const youtubeResults = await yt_search_1.default(youtubeQuery);
        const video = youtubeResults.videos[0];
        const stream = ytdl_core_1.default(video.url, {
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
        if (!this.connection) {
            this._failJoinVoiceChannel();
            return;
        }
        const round = new round_js_1.default(track, stream, this.connection, this.textChannel, this.roundDuration, (title) => {
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
            discord_helpers_js_1.sendEmbed(this.textChannel, 'Could not load round from empty buffer');
            return;
        }
        discord_helpers_js_1.sendEmbed(this.textChannel, `[${this.currRound + 1}/${this.roundLimit}] Starting next song...`);
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
                .setTitle(title)
                .setColor(title === 'Round summary' ? '#2ECC71' : '#E91E63')
                .setDescription(this.round.guesses.toString(true))
                .setThumbnail(this.round.track?.img)
                .addField('\u200B', '\u200B')
                .addField('🏆 Leaderboard', this.leaderboard.toString());
            this.textChannel.send({ embed: roundSummary });
        }
        this.currRound++;
        this._startRound();
    }
    skipRound() {
        this.round?.endRound(false);
        this._endRound('Skipping round...');
    }
    async _connectToVoiceChannel() {
        try {
            this.connection = await this.voiceChannel.join();
        }
        catch (err) {
            console.error(err);
            this._failJoinVoiceChannel();
        }
    }
    _failJoinVoiceChannel() {
        discord_helpers_js_1.sendEmbed(this.textChannel, 'Could not join voice channel 😞');
        this.connection = null;
        this.endGame();
    }
    endGame(useCallback = true) {
        console.log(`#${this.textChannel.name}: Game ended ${useCallback ? 'naturally' : 'manually'}`);
        this.currRound = this.roundLimit;
        this.voiceChannel.leave();
        this.round?.endRound(false);
        this.round = null;
        this.connection = null;
        const gameSummary = new discord_js_1.MessageEmbed()
            .setTitle('🏁 Final Leaderboard')
            .setColor('#3498DB')
            .setDescription(this.leaderboard.toString());
        this.textChannel.send({ embed: gameSummary });
        if (!useCallback)
            return;
        this.callback();
    }
}
exports.default = Game;

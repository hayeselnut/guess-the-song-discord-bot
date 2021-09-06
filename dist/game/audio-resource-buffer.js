"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const yt_search_1 = __importDefault(require("yt-search"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const cookie_json_1 = __importDefault(require("../assets/cookie.json"));
const game_helpers_1 = require("../helpers/game-helpers");
class AudioResourceBuffer {
    constructor(tracks, roundLimit) {
        this.buffer = [];
        this.bufferSize = 5;
        this.bufferIndex = 0;
        this.roundLimit = roundLimit;
        this.tracks = tracks;
        this.order = (0, game_helpers_1.shuffle)(Object.keys(tracks)).slice(0, this.roundLimit);
    }
    async initializeBuffer() {
        while (this.bufferIndex < Math.min(this.bufferSize, this.roundLimit)) {
            await this._pushNewAudioResourceToBuffer();
        }
    }
    getNextAudioResourceAndUpdateBuffer() {
        // Buffer a new track if possible
        if (this.bufferIndex < this.roundLimit) {
            this._pushNewAudioResourceToBuffer();
        }
        // Return next audio resource
        return this.buffer.shift();
    }
    async _pushNewAudioResourceToBuffer() {
        const trackId = this.order[this.bufferIndex];
        const track = this.tracks[trackId];
        const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
        const youtubeResults = await (0, yt_search_1.default)(youtubeQuery);
        const video = youtubeResults.videos[0];
        const stream = (0, ytdl_core_1.default)(video.url, {
            filter: 'audioonly',
            requestOptions: {
                headers: cookie_json_1.default,
            },
        });
        // TODO handle error on load
        const audioResource = (0, voice_1.createAudioResource)(stream, {
            inputType: voice_1.StreamType.Arbitrary,
            metadata: track,
        }); // TODO no seek option?
        this.buffer.push(audioResource);
        this.bufferIndex++;
    }
}
exports.default = AudioResourceBuffer;

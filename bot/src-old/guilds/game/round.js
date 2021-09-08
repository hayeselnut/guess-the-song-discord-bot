"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const guesses_js_1 = __importDefault(require("./guesses.js"));
class Round {
    constructor(track, stream, audioPlayer, textChannel, timeLimit, callback) {
        // Discord things
        this.audioPlayer = audioPlayer;
        this.textChannel = textChannel;
        // Current song
        this.track = track;
        this.stream = stream;
        this.guesses = new guesses_js_1.default(this.track);
        // Ending things
        this.timeout = null;
        this.timeLimit = timeLimit;
        this.callback = callback;
    }
    startRound() {
        this._startTimeLimit();
        this._playTrack();
    }
    checkGuess(message) {
        const guessCorrect = this.guesses.checkGuess(message);
        if (this.guesses.guessedAll()) {
            this.endRound();
        }
        else if (guessCorrect) {
            this._showProgress();
        }
    }
    _showProgress() {
        const progressEmbed = new discord_js_1.MessageEmbed()
            .setDescription(this.guesses.toString())
            .setColor('GOLD');
        this.textChannel.send({ embeds: [progressEmbed] });
    }
    endRound(useCallback = true, title) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (!useCallback)
            return;
        this.callback(title);
    }
    _playTrack() {
        // Start the music video at a random point between 0 and 90 seconds
        if (!this.stream) {
            console.error(`#${this.textChannel.name}:`, 'ERROR - Cannot play', this.track.name, this.track.artists);
            return this.endRound(true, 'Could not load song. Skipping song...');
        }
        try {
            const audioResource = (0, voice_1.createAudioResource)(this.stream, { inputType: voice_1.StreamType.Arbitrary }); // TODO no seek option
            this.audioPlayer.play(audioResource);
            this.audioPlayer.on('error', (err) => {
                console.error(err);
                console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists);
                return this.endRound(true, 'Could not load song. Skipping song...');
            });
        }
        catch (err) {
            console.error(err);
            console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists);
            return this.endRound(true, 'Could not load song. Skipping song...');
        }
    }
    _startTimeLimit() {
        this.timeout = setTimeout(() => {
            this.endRound(true, 'Too slow! Skipping song...');
        }, this.timeLimit * 1000);
    }
}
exports.default = Round;
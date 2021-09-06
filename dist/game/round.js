"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guesses_1 = __importDefault(require("./guesses"));
class Round {
    constructor(audioResource, audioPlayer, textChannel, timeLimit, callback) {
        this.audioPlayer = audioPlayer;
        this.textChannel = textChannel;
        this.audioResource = audioResource;
        this.track = this.audioResource.metadata;
        this.guesses = new guesses_1.default(this.track);
        this.callback = callback;
        this.timer = setTimeout(() => {
            console.debug('Timeout!');
            this.endRound('TIMEOUT', this.callback);
        }, timeLimit * 1000);
    }
    startRound() {
        // Start playing audio resource
        try {
            // Asssumes connection is already subscribed to audio resource
            this.audioPlayer.play(this.audioResource);
        }
        catch (err) {
            console.error(`#${this.textChannel.name}:`, '[ERROR CAUGHT IN CATCH] - Cannot play', this.track.name, this.track.artists, err);
            return this.endRound('LOAD_FAIL', this.callback);
        }
    }
    checkGuess(message) {
        const guessCorrect = this.guesses.checkGuess(message);
        if (guessCorrect && this.guesses.guessedAll()) {
            this.endRound('CORRECT', this.callback);
        }
        else if (guessCorrect) {
            this._showProgress();
        }
    }
    _showProgress() {
        const progressEmbed = new discord_js_1.MessageEmbed()
            .setDescription(this.guesses.toProgressString())
            .setColor('GOLD');
        this.textChannel.send({ embeds: [progressEmbed] });
    }
    skipRound() {
        this.endRound('FORCE_SKIP', this.callback);
    }
    endRound(reason, callback) {
        clearTimeout(this.timer);
        if (callback) {
            callback(reason);
        }
    }
}
exports.default = Round;

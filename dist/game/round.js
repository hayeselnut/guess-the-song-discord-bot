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
        this.timeLimit = timeLimit;
        this.timer = setTimeout(() => {
            this.endRound('TIMEOUT');
        }, this.timeLimit * 1000);
    }
    startRound() {
        // Start playing audio resource
        try {
            // Asssumes connection is already subscribed to audio resource
            this.audioPlayer.play(this.audioResource);
            this.audioPlayer.on('error', (err) => {
                console.error(`#${this.textChannel.name}:`, 'ERR - Cannot play', this.track.name, this.track.artists, err);
                return this.endRound('LOAD_FAIL');
            });
        }
        catch (err) {
            console.error(`#${this.textChannel.name}:`, '[ERROR NOT HANDLED PROPERLY] - Cannot play', this.track.name, this.track.artists, err);
            return this.endRound('LOAD_FAIL');
        }
    }
    checkGuess(message) {
        const guessCorrect = this.guesses.checkGuess(message);
        if (guessCorrect && this.guesses.guessedAll()) {
            this.endRound('CORRECT');
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
    endRound(reason, callback) {
        clearTimeout(this.timer);
        if (callback) {
            callback(reason);
        }
    }
}
exports.default = Round;

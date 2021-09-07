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
        this.track = audioResource.metadata;
        this.guesses = new guesses_1.default(this.track);
        this.callback = callback;
        this.timer = setTimeout(() => {
            this.endRound('TIMEOUT');
        }, timeLimit * 1000);
    }
    startRound() {
        // Start playing audio resource
        if (this.audioResource.ended) {
            console.log(`#${this.textChannel.name}: Could not load`, this.track.name, this.track.artists);
            return this.endRound('LOAD_FAIL');
        }
        this.audioPlayer.play(this.audioResource);
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
    endRound(reason) {
        clearTimeout(this.timer);
        setTimeout(() => {
            this.callback(reason);
        }, 100);
    }
}
exports.default = Round;
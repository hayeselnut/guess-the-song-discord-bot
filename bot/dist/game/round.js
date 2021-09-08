"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guesses_1 = __importDefault(require("./guesses"));
class Round {
    constructor(audioResource, audioPlayer, textChannel, timeLimit, callback) {
        this.finished = false;
        this.audioPlayer = audioPlayer;
        this.textChannel = textChannel;
        this.audioResource = audioResource;
        this.track = audioResource.metadata;
        this.guesses = new guesses_1.default(this.track);
        this.callback = callback;
        this.timer = setTimeout(() => {
            this.endRound('TIMEOUT');
        }, timeLimit * 1000); // timeLimit is in secs
    }
    startRound() {
        // `started` flag will be false if stream has not finished loading or error occured e.g. 410 error
        // To ensure we give sufficient time for stream to load and not mistakenly read it as an error,
        // we will try playing the resource again after a retry delay.
        if (this.audioResource.ended) {
            console.log(`#${this.textChannel.name}: Could not load`, this.track.name, this.track.artists);
            return this.endRound('LOAD_FAIL');
        }
        if (!this.audioResource.started) {
            console.log(`#${this.textChannel.name}: Delay when loading`, this.track.name, this.track.artists);
            setTimeout(() => {
                // Ensure music starts playing within 3 seconds, otherwise end round
                if (!this.audioResource.started) {
                    console.log(`#${this.textChannel.name}: Did not load in time`, this.track.name, this.track.artists);
                    this.endRound('LOAD_FAIL');
                }
                else {
                    console.log(`#${this.textChannel.name}: Loaded successfully`, this.track.name, this.track.artists);
                }
            }, 5 * 1000);
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
        if (this.finished) {
            return console.log(`#${this.textChannel.name}: Tried to end round that has already been ended`);
        }
        ;
        this.finished = true;
        // Need a small time delay when ending rounds to ensure future end rounds dont execute before this one.
        // Basically ensures that rounds are ended in order.
        setTimeout(() => {
            this.callback(reason);
        }, 100);
    }
}
exports.default = Round;

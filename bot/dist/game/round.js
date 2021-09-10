"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guesses_1 = __importDefault(require("./guesses"));
class Round {
    constructor(audioResource, audioPlayer, textChannel, config, callback) {
        this.audioResource = audioResource;
        this.audioPlayer = audioPlayer;
        this.textChannel = textChannel;
        this.config = config;
        this.callback = callback;
        this.finished = false;
        this.track = audioResource.metadata;
        this.guesses = new guesses_1.default(this.track, this.config.emote_nearly_correct_guesses);
        this.timer = setTimeout(() => {
            this.endRound('TIMEOUT');
        }, this.config.round_duration * 1000); // timeLimit is in secs
    }
    startRound() {
        if (this.audioResource.ended) {
            console.log(`#${this.textChannel.name}: Could not load`, this.track.name, this.track.artists);
            return this.endRound('LOAD_FAIL');
        }
        // `started` flag will be false if stream has not finished loading or error occured e.g. 410 error
        // End round after 5 seconds if the resource has still not started (most likely caused by error)
        if (!this.audioResource.started) {
            console.log(`#${this.textChannel.name}: Delay when loading`, this.track.name, this.track.artists);
            setTimeout(() => {
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
        if (guessCorrect && this.guesses.isFinished()) {
            this.endRound('CORRECT');
        }
        else if (guessCorrect) {
            this.showProgress();
        }
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
    showProgress() {
        const progressEmbed = new discord_js_1.MessageEmbed()
            .setDescription(this.guesses.toProgressString())
            .setColor('GOLD');
        this.textChannel.send({ embeds: [progressEmbed] });
    }
}
exports.default = Round;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_helpers_js_1 = require("../../helpers/discord-helpers.js");
const normalize_helpers_js_1 = require("../../helpers/normalize-helpers.js");
const SONG_INDEX = -1;
class Guesses {
    constructor(track) {
        this.track = track;
        // -1 is song, 0..n-1 is for each of the n artists
        this.answeredBy = new Map([
            [SONG_INDEX, ''],
            ...this.track.artists.map((_, i) => [i, '']),
        ]);
        this.remainingPoints = this.track.artists.length + 1;
    }
    guessedAll() {
        return this.remainingPoints <= 0;
    }
    checkGuess(message) {
        const guessedName = this._checkGuessForName(message);
        const guessedArtists = this._checkGuessForArtists(message);
        return guessedName || guessedArtists;
    }
    _checkGuessForName(message) {
        if (this.answeredBy.get(SONG_INDEX))
            return false;
        const guess = normalize_helpers_js_1.normalize(message.content, 'name');
        if (guess != this.track.normalizedName)
            return false;
        this.answeredBy.set(SONG_INDEX, discord_helpers_js_1.tag(message.author));
        this.remainingPoints--;
        return true;
    }
    _checkGuessForArtists(message) {
        return this.track.normalizedArtists.map((artist, index) => {
            if (this.answeredBy.get(index))
                return false;
            const guess = normalize_helpers_js_1.normalize(message.content, 'artist');
            if (artist != guess)
                return false;
            this.answeredBy.set(index, discord_helpers_js_1.tag(message.author));
            this.remainingPoints--;
            return true;
        }).some((b) => b);
    }
    toString(final = false) {
        const displayName = normalize_helpers_js_1.removeAdditionalInformation(this.track.name);
        const nameGuesses = this.answeredBy.get(SONG_INDEX)
            ? `✅ Song: **${displayName}** guessed correctly by ${this.answeredBy.get(SONG_INDEX)} (+1)`
            : final
                ? `❌ Song: **${displayName}**`
                : `⬜ Song: **???**`;
        const artistsGuesses = this.track.artists.map((artist, index) => (this.answeredBy.get(index)
            ? `✅ Artist: **${artist}** guessed correctly by ${this.answeredBy.get(index)} (+1)`
            : final
                ? `❌ Artist: **${artist}**`
                : `⬜ Artist: **???**`)).join('\n');
        return `${nameGuesses}\n${artistsGuesses}`;
    }
}
exports.default = Guesses;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_helpers_1 = require("../helpers/normalize-helpers");
const SONG_INDEX = -1;
const UNANSWERED = '';
class Guesses {
    constructor(track) {
        this.track = track;
        this.answeredBy = new Map([
            [SONG_INDEX, UNANSWERED],
            ...this.track.artists.map((_, i) => [i, UNANSWERED]),
        ]);
    }
    get remainingPoints() {
        return [...this.answeredBy].filter(([_, tag]) => tag === UNANSWERED).length;
    }
    isFinished() {
        return this.remainingPoints <= 0;
    }
    checkGuess(message) {
        const guessedName = this.checkGuessForName(message);
        const guessedArtists = this.checkGuessForArtists(message);
        return guessedName || guessedArtists;
    }
    toProgressString() {
        return this.toString();
    }
    toResultString() {
        return this.toString(true);
    }
    checkGuessForName(message) {
        if (this.answeredBy.get(SONG_INDEX))
            return false;
        const guess = (0, normalize_helpers_1.normalize)(message.content, 'name');
        if (guess != this.track.normalizedName)
            return false;
        this.answeredBy.set(SONG_INDEX, message.author.toString());
        return true;
    }
    checkGuessForArtists(message) {
        return this.track.normalizedArtists.map((artist, index) => {
            if (this.answeredBy.get(index))
                return false;
            const guess = (0, normalize_helpers_1.normalize)(message.content, 'artist');
            if (artist != guess)
                return false;
            this.answeredBy.set(index, message.author.toString());
            return true;
        }).some((b) => b);
    }
    toString(final = false) {
        const displayName = final ? this.track.name : (0, normalize_helpers_1.censorArtists)(this.track.name, this.track.artists);
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

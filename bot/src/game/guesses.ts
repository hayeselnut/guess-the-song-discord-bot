import { Track } from '../../src-old/types';
import { normalize, removeAdditionalInformation } from '../helpers/normalize-helpers';
import { ValidMessage } from '../types/discord';

const SONG_INDEX = -1;
const UNANSWERED = '';

export default class Guesses {
    private track: Track;
    answeredBy: Map<number, string>;

    constructor(track: Track) {
      this.track = track;

      // -1 is song, 0..n-1 is for each of the n artists
      this.answeredBy = new Map([
        [SONG_INDEX, UNANSWERED],
        ...this.track.artists.map((_, i: number) => [i, UNANSWERED]),
      ] as [number, string][]);
    }

    guessedAll() {
      return this._remainingPoints() <= 0;
    }

    checkGuess(message: ValidMessage) {
      const guessedName = this._checkGuessForName(message);
      const guessedArtists = this._checkGuessForArtists(message);
      return guessedName || guessedArtists;
    }

    toProgressString() {
      return this._toString();
    }

    toResultString() {
      return this._toString(true);
    }

    _remainingPoints() {
      return [...this.answeredBy].filter(([_, tag]) => tag === UNANSWERED).length;
    }

    _checkGuessForName(message: ValidMessage) {
      if (this.answeredBy.get(SONG_INDEX)) return false;

      const guess = normalize(message.content, 'name');
      if (guess != this.track.normalizedName) return false;

      this.answeredBy.set(SONG_INDEX, message.author.toString());
      return true;
    }

    _checkGuessForArtists(message: ValidMessage) {
      return this.track.normalizedArtists.map((artist, index) => {
        if (this.answeredBy.get(index)) return false;

        const guess = normalize(message.content, 'artist');
        if (artist != guess) return false;

        this.answeredBy.set(index, message.author.toString());
        return true;
      }).some((b) => b);
    }

    _toString(final: boolean = false) {
      const displayName = removeAdditionalInformation(this.track.name);
      const nameGuesses = this.answeredBy.get(SONG_INDEX)
        ? `✅ Song: **${displayName}** guessed correctly by ${this.answeredBy.get(SONG_INDEX)} (+1)`
        : final
          ? `❌ Song: **${displayName}**`
          : `⬜ Song: **???**`;

      const artistsGuesses = this.track.artists.map((artist, index) => (
        this.answeredBy.get(index)
          ? `✅ Artist: **${artist}** guessed correctly by ${this.answeredBy.get(index)} (+1)`
          : final
            ? `❌ Artist: **${artist}**`
            : `⬜ Artist: **???**`
      )).join('\n');

      return `${nameGuesses}\n${artistsGuesses}`;
    }
}


import { ValidMessage } from '../types/discord';
import { Track } from '../types/tracks';

import { censorArtists, normalize } from '../helpers/normalize-helpers';

const SONG_INDEX = -1;
const UNANSWERED = '';

export default class Guesses {
    // -1 is song, 0..n-1 is for each of the n artists
    answeredBy: Map<number, string>;

    constructor(private readonly track: Track) {
      this.answeredBy = new Map([
        [SONG_INDEX, UNANSWERED],
        ...this.track.artists.map((_, i: number) => [i, UNANSWERED]),
      ] as [number, string][]);
    }

    get remainingPoints(): number {
      return [...this.answeredBy].filter(([_, tag]) => tag === UNANSWERED).length;
    }

    isFinished() {
      return this.remainingPoints <= 0;
    }

    checkGuess(message: ValidMessage) {
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

    private checkGuessForName(message: ValidMessage) {
      if (this.answeredBy.get(SONG_INDEX)) return false;

      const guess = normalize(message.content, 'name');
      if (guess != this.track.normalizedName) return false;

      this.answeredBy.set(SONG_INDEX, message.author.toString());
      return true;
    }

    private checkGuessForArtists(message: ValidMessage) {
      return this.track.normalizedArtists.map((artist, index) => {
        if (this.answeredBy.get(index)) return false;

        const guess = normalize(message.content, 'artist');
        if (artist != guess) return false;

        this.answeredBy.set(index, message.author.toString());
        return true;
      }).some((b) => b);
    }

    private toString(final: boolean = false) {
      const displayName = final ? this.track.name : censorArtists(this.track.name, this.track.artists);
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


import { Message } from 'discord.js';
import { tag } from '../../helpers/discord-helpers.js';
import { normalize, removeAdditionalInformation } from '../../helpers/normalize-helpers.js';
import { track } from '../../types.js';

const SONG_INDEX = -1;

export default class Guesses {
  track: track;
  answeredBy: Map<number, string>;
  remainingPoints: number;

  constructor(track: track) {
    this.track = track;

    // -1 is song, 0..n-1 is for each of the n artists
    this.answeredBy = new Map([
      [SONG_INDEX, ''],
      ...this.track.artists.map((_, i: number) => [i, '']),
    ] as [number, string][]);
    this.remainingPoints = this.track.artists.length + 1;
  }

  guessedAll() {
    return this.remainingPoints <= 0;
  }

  checkGuess(message: Message) {
    const guessedName = this._checkGuessForName(message);
    const guessedArtists = this._checkGuessForArtists(message);

    return guessedName || guessedArtists;
  }

  _checkGuessForName(message: Message) {
    if (this.answeredBy.get(SONG_INDEX)) return false;

    const guess = normalize(message.content, 'name');
    if (guess != this.track.normalizedName) return false;

    this.answeredBy.set(SONG_INDEX, tag(message.author));
    this.remainingPoints--;
    return true;
  }

  _checkGuessForArtists(message: Message) {
    return this.track.normalizedArtists.map((artist, index) => {
      if (this.answeredBy.get(index)) return false;

      const guess = normalize(message.content, 'artist');
      if (artist != guess) return false;

      this.answeredBy.set(index, tag(message.author));
      this.remainingPoints--;
      return true;
    }).some((b) => b);
  }

  toString(final: boolean = false) {
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

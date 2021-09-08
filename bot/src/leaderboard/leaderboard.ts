import Guesses from '../game/guesses';
import { LeaderboardPoints } from '../types/game';

export default class Leaderboard {
  readonly points: LeaderboardPoints;

  constructor(initialState?: LeaderboardPoints) {
    // Storing points in a object rather than map since it's easier to upload to database
    this.points = initialState ?? {};
  }

  addPlayer(player: string) {
    this.addPoints(player, 0);
  }

  addPoints(player: string, points: number = 1) {
    this.points[player] = (this.points[player] ?? 0) + points;
  }

  mergeAndIncrementWinners(other: Leaderboard) {
    const players = other.getPlayers();
    if (!players.length) return;

    players.forEach((player) => {
      if (!(player in other)) {
        this.addPlayer(player);
      }
    });

    const winners = other.getWinners();
    winners.forEach((winner) => {
      this.addPoints(winner);
    });
  }

  update(guesses: Guesses) {
    guesses.answeredBy.forEach((player: string) => {
      if (player) {
        this.addPoints(player);
      }
    });
  }

  toString() {
    const sorted = Object.entries(this.points)
      .sort(([, aPoints], [, bPoints]) => bPoints - aPoints);

    return sorted.length ? this._rankString(sorted, 0) : 'No points earned yet!';
  }

  getPlayers() {
    return Object.keys(this.points);
  }

  getWinners() {
    const highestPoints = Math.max(...Object.values(this.points));
    return Object.entries(this.points)
      .filter(([, points]) => points === highestPoints)
      .map(([player]) => player);
  }

  private _rankString(sorted: [string, number][], index: number): string {
    if (sorted.length <= index) {
      return '';
    }

    const [authorTag, points] = sorted[index];

    if (index === 0) {
      return `**${index + 1}**. (${points}) ${authorTag}` + this._rankString(sorted, index + 1);
    }

    const [, prevPoints] = sorted[index - 1];
    if (points === prevPoints) {
      return `, ${authorTag}` + this._rankString(sorted, index + 1);
    }

    return `\n**${index + 1}**. (${points}) ${authorTag}` + this._rankString(sorted, index + 1);
  }
}

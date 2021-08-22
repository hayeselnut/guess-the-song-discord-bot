import Guesses from "./guesses";

export default class Leaderboard {
  private points: Map<string, number>; // <PLAYER, POINTS>

  constructor(initialState?: Leaderboard) {
    this.points = initialState ? new Map(Object.entries(initialState)) : new Map();
  }

  addPoints(player: string, points: number = 1) {
    this.points.set(player, (this.points.get(player) || 0) + points);
  }

  update(guesses: Guesses) {
    if (!guesses) return;
    guesses.answeredBy.forEach((player: string) => {
      if (player) {
        this.addPoints(player);
      }
    });
  }

  toString() {
    const sorted = [...this.points.entries()]
      .sort(([, aPoints], [, bPoints]) => bPoints - aPoints);

    return sorted.length ? this._rankString(sorted, 0) : 'No points earned yet!';
  }

  getPlayers() {
    return [...this.points.keys()];
  }

  getWinners() {
    const highestPoints = Math.max(...this.points.values());
    return [...this.points.entries()]
      .filter(([, points]) => points === highestPoints)
      .map(([player]) => player);
  }

  _rankString(sorted: [string, number][], index: number): string {
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

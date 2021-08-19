/* eslint-disable require-jsdoc */
export default class Leaderboard {
  constructor() {
    this.points = new Map(); // <PLAYER, POINTS>
  }

  addPoints(player, points=1) {
    this.points.set(player, (this.points.get(player) || 0) + points);
  }

  update(guesses) {
    if (!guesses) return;
    guesses.answeredBy.forEach((player) => {
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

  _rankString(sorted, index) {
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

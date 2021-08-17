/* eslint-disable require-jsdoc */
export default class Leaderboard {
  constructor() {
    this.positions = new Map();
    // TODO handle tie
  }

  addPoints(player, points=1) {
    this.positions.set(player, (this.positions.get(player) || 0) + points);
  }

  update(guesses) {
    if (!guesses) return;
    guesses.answeredBy.forEach((player) => {
      if (player) {
        this.addPoints(player);
      }
    });
  }

  getWinner() {
    return [...this.positions.entries()]
      .sort(([, aPoints], [, bPoints]) => bPoints - aPoints)[0];
  }

  toString() {
    return [...this.positions.entries()]
      .sort(([, aPoints], [, bPoints]) => bPoints - aPoints)
      .map(([authorTag, points], index) => `**${index + 1}**. (${points}) ${authorTag}`)
      .join('\n') || 'No points earned yet!';
  }
}

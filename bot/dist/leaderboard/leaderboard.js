"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Leaderboard {
    constructor(initialState) {
        // Storing points in a object rather than map since it's easier to upload to database
        this.points = initialState ?? {};
    }
    addPlayer(player) {
        this.addPoints(player, 0);
    }
    addPoints(player, points = 1) {
        this.points[player] = (this.points[player] ?? 0) + points;
    }
    mergeAndIncrementWinners(other) {
        const players = other.getPlayers();
        if (!players.length)
            return;
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
    update(guesses) {
        guesses.answeredBy.forEach((player) => {
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
exports.default = Leaderboard;

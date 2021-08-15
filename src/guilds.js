/* eslint-disable require-jsdoc */

export default class Guilds {
  constructor() {
    this.ongoingGames = new Map();
  }

  has(key) {
    return this.ongoingGames.has(key);
  }

  getGame(message) {
    const game = this.ongoingGames.get(message.guild.id);
    return game?.textChannel?.id == message.channel.id ? game : undefined;
  }

  startGame(message, game) {
    this.ongoingGames.set(message.guild.id, game);
  }

  stopGame(message) {
    this.ongoingGames.delete(message.guild.id);
  }
}

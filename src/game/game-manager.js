/* eslint-disable require-jsdoc */
import { MessageEmbed } from 'discord.js';
import Game from './game.js';

export default class GameManager {
  constructor() {
    this.guilds = new Map();
  }

  has(guildId) {
    return this.guilds.has(guildId);
  }

  getGame(message) {
    const game = this.guilds.get(message.guild.id);
    return game?.textChannel?.id == message.channel.id ? game : undefined;
  }

  finishGame(guildId) {
    const game = this.guilds.get(guildId);
    if (!game) return;

    game.endGame(false);
    this.guilds.delete(guildId);
  }

  async initializeGame(message, name, img, tracks, roundLimit) {
    const tracksLength = Object.keys(tracks).length;
    const playlistEmbed = new MessageEmbed()
      .setTitle(name)
      .setDescription(`Loading ${tracksLength} songs...`)
      .setImage(img);
    message.channel.send({ embed: playlistEmbed });

    const game = new Game(message, tracks, Math.min(tracksLength, roundLimit), () => {
      this.guilds.delete(message.guild.id);
    });
    this.guilds.set(message.guild.id, game);
    game.startGame();
  }
}

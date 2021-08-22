import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { sendEmbed } from '../helpers/discord-helpers.js';
import { parseRoundDuration } from '../helpers/helpers.js';
import Game from './game/game.js';

export default class GameManager {
  db: any;
  game: any;
  guildId: any;
  prefix: any;
  roundDuration: any;
  emoteNearlyCorrectGuesses: any;
  leaderboard: any;
  constructor(db, game, guildId, config) {
    this.db = db;
    this.game = game;
    this.guildId = guildId;

    // These states will always be synced with database
    this.prefix = config.prefix;
    this.roundDuration = config.round_duration;
    this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
    this.leaderboard = config.leaderboard;
  }

  updatePrefix(prefix: string, message: Message) {
    const newPrefix = String(prefix);
    sendEmbed(message.channel, `Prefix has been set to \`${newPrefix}\``);
    this.prefix = newPrefix;
    this._updateDatabase();
  }

  updateRoundDuration(duration: string, message: Message) {
    const newRoundDuration = parseRoundDuration(duration);
    if (isNaN(newRoundDuration)) {
      return sendEmbed(message.channel, 'Round duration limit must be a number');
    }
    sendEmbed(message.channel, `Round duration limit has been set to ${newRoundDuration} seconds`);
    this.roundDuration = newRoundDuration;
    this._updateDatabase();
  }

  // updateEmote(emote) {
  //   this.emoteNearlyCorrectGuesses = emote;
  // }

  updateLeaderboard(game) {
    const players = game.leaderboard.getPlayers();
    if (!players.length) return;

    players.forEach((player) => {
      if (!(player in this.leaderboard)) {
        this.leaderboard[player] = 0;
      }
    });

    const winners = game.leaderboard.getWinners();
    winners.forEach((winner) => {
      this.leaderboard[winner]++;
    });

    // Update database
    this.db.collection('guilds').doc(this.guildId).set({
      leaderboard: this.leaderboard,
    }, { merge: true });
  }

  clearGame() {
    this.game.endGame(false);
    this.updateLeaderboard(this.game);
    this.game = null;
  }

  initializeGame(message, name, img, tracks, roundLimit) {
    const tracksLength = Object.keys(tracks).length;
    const playlistEmbed = new MessageEmbed()
      .setTitle(name)
      .setDescription(`Loading ${tracksLength} songs...`)
      .setImage(img);
    message.channel.send({ embed: playlistEmbed });

    console.log(`Initializing game in GUILD ${message.guild.name}`);
    const game = new Game(message, tracks, Math.min(tracksLength, roundLimit), this.roundDuration, () => {
      this.updateLeaderboard(this.game);

      this.game = null;
    });
    this.game = game;
    game.startGame();
  }

  getLeaderboard() {
    return this.leaderboard;
  }

  getConfig() {
    return {
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
    };
  }

  loadConfig() {
    this.prefix = prefix;
  }

  _updateDatabase() {
    this.db.collection('guilds').doc(this.guildId).set({
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
      leaderboard: this.leaderboard,
    });
  }
}

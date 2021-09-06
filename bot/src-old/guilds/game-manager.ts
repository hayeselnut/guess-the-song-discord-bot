import { MessageEmbed } from 'discord.js';
import { firestore } from 'firebase-admin';
import { sendEmbed } from '../helpers/discord-helpers.js';
import { parseRoundDuration } from '../helpers/helpers.js';
import { Config, Tracks, ValidMessage, ValidMessageWithVoiceChannel } from '../types.js';
import Game from './game/game.js';

export default class GameManager {
  db: firestore.Firestore;
  game: Game | null;
  guildId: string;
  prefix: string;
  roundDuration: number;
  emoteNearlyCorrectGuesses: boolean;
  leaderboard: { [id: string]: number};

  constructor(db: firestore.Firestore, game: Game | null, guildId: string, config: Config) {
    this.db = db;
    this.game = game;
    this.guildId = guildId;

    // These states will always be synced with database
    this.prefix = config.prefix;
    this.roundDuration = config.round_duration;
    this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
    this.leaderboard = config.leaderboard;
  }

  updatePrefix(prefix: string, message: ValidMessage) {
    const newPrefix = String(prefix);
    sendEmbed(message.channel, `Prefix has been set to \`${newPrefix}\``);
    this.prefix = newPrefix;
    this._updateDatabase();
  }

  updateRoundDuration(duration: string, message: ValidMessage) {
    const newRoundDuration = parseRoundDuration(duration);
    if (isNaN(newRoundDuration)) {
      return sendEmbed(message.channel, 'Round duration limit must be a number');
    }
    sendEmbed(message.channel, `Round duration limit has been set to ${newRoundDuration} seconds`);
    this.roundDuration = newRoundDuration;
    this._updateDatabase();
  }

  updateLeaderboard(game: Game) {
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
    if (!this.game) return;

    this.game.endGame(false);
    this.updateLeaderboard(this.game);
    this.game = null;
  }

  initializeGame(message: ValidMessageWithVoiceChannel, name: string, img: string | undefined, tracks: Tracks, roundLimit: number) {
    const tracksLength = Object.keys(tracks).length;
    const newRoundLimit = Math.min(tracksLength, roundLimit);

    const playlistEmbed = new MessageEmbed()
      .setTitle(name)
      .setDescription(`Loading ${newRoundLimit} songs...`)
      .setImage(img ?? '');
    message.channel.send({ embeds: [playlistEmbed] });

    console.log(`Initializing game of ${newRoundLimit} rounds in GUILD ${message.guild.name}`);
    const game = new Game(message, tracks, newRoundLimit, this.roundDuration, () => {
      if (this.game) {
        this.updateLeaderboard(this.game);
      }

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

  _updateDatabase() {
    this.db.collection('guilds').doc(this.guildId).set({
      prefix: this.prefix,
      round_duration: this.roundDuration,
      emote_nearly_correct_guesses: this.emoteNearlyCorrectGuesses,
      leaderboard: this.leaderboard,
    });
  }
}

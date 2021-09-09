import { MessageEmbed } from 'discord.js';

import { EndGameReason, GuildConfig, LeaderboardPoints } from '../types/game';
import { ValidMessage } from '../types/discord';

import client from '../client/client';
import spotify from '../spotify/spotify';
import Game from '../game/game';
import db from '../db/db';
import Leaderboard from '../leaderboard/leaderboard';

import { isValidMessageWithVoice, parseMessage, sendEmbed } from '../helpers/bot-helpers';
import { parseStartGameArgs, throwIfInsufficientVoicePermissions } from '../helpers/game-helpers';

import Help from '../assets/help.json';
import DefaultConfig from '../assets/default-config.json';

// Responsible for maintaining Guild state and parsing messages
export default class Guild {
  private leaderboard: Leaderboard;
  private game: Game | null = null;

  constructor(
    private readonly guildId: string,
    private config: GuildConfig = DefaultConfig,
    points: LeaderboardPoints = {},
  ) {
    this.leaderboard = new Leaderboard(points);
  }

  readMessage(message: ValidMessage) {
    if (message.content.startsWith(this.config.prefix)) {
      this.readCommand(message);
    }

    // Mentioning the bot shows the help menu
    if (message.mentions.has(client.user!.id)) {
      this.showHelp(message);
    }

    // Check guess if the game exists
    this.game?.checkGuess(message);
  }

  private async readCommand(message: ValidMessage) {
    try {
      if (message.content.startsWith(`${this.config.prefix}start`)) {
        // Must await to catch the error thrown
        await this.startGame(message);
      } else if (message.content.startsWith(`${this.config.prefix}stop`)) {
        this.stopGame(message);
      } else if (message.content.startsWith(`${this.config.prefix}skip`)) {
        this.skipRound(message);
      } else if (message.content.startsWith(`${this.config.prefix}leaderboard`)) {
        this.showLeaderboard(message);
      } else if (message.content.startsWith(`${this.config.prefix}config`)) {
        this.showConfig(message);
      } else if (message.content.startsWith(`${this.config.prefix}help`)) {
        this.showHelp(message);
      } else {
        throw new Error(`Invalid command. Use \`${this.config.prefix}help\` for a list of commands.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        return sendEmbed(message.channel, `⚠: ${error.message}`);
      }
      console.error('ERROR reading command', message.content, error);
    }
  }

  private async startGame(message: ValidMessage) {
    if (this.game) throw new Error(`There's already a game running!`);

    const args = parseMessage(message);
    const { roundLimit, playlistLinks } = parseStartGameArgs(args, this.config.prefix);

    if (!isValidMessageWithVoice(message)) {
      throw new Error('You need to be in a voice channel to play music');
    }
    throwIfInsufficientVoicePermissions(message);

    // Initialize game
    const { name, img, tracks } = await spotify.getPlaylists(playlistLinks);
    const tracksLength = Object.keys(tracks).length;
    const newRoundLimit = Math.min(tracksLength, roundLimit);

    const playlistEmbed = new MessageEmbed()
      .setTitle(name)
      .setDescription(`Loading ${newRoundLimit} songs...`)
      .setImage(img ?? '');
    message.channel.send({ embeds: [playlistEmbed] });

    console.log(`${message.guild.name} - #${message.channel.name}: Initializing game of ${newRoundLimit} rounds`);

    // Create arrow function to preserve 'this' context
    const endGameCallback = (reason: EndGameReason) => this.endGameCallback(reason);
    this.game = new Game(message, this.config, newRoundLimit, tracks, endGameCallback);
    this.game.startGame();
  }

  private stopGame(message: ValidMessage) {
    if (!this.game) throw new Error('Nothing to stop here!');
    if (this.game.host !== message.member.toString()) {
      throw new Error(`Only the host ${this.game.host} can stop a game.`);
    }

    this.game.endGame('FORCE_STOP');
  }

  private skipRound(message: ValidMessage) {
    if (!this.game) throw new Error('Nothing to skip here!');
    if (this.game.host !== message.member.toString()) {
      throw new Error(`Only the host ${this.game.host} can skip rounds.`);
    }

    this.game.skipRound();
  }

  private endGameCallback(reason: EndGameReason) {
    if (this.game) {
      this.leaderboard.mergeAndIncrementWinners(this.game.leaderboard);
    }
    this.game = null;

    // Update database
    db.collection('guilds').doc(this.guildId).set({
      leaderboard: this.leaderboard.points,
    }, { merge: true });
  }

  private showLeaderboard(message: ValidMessage) {
    sendEmbed(message.channel, this.leaderboard.toString());
  }

  private showConfig(message: ValidMessage) {
    // TODO allow setting of configs
    sendEmbed(message.channel, JSON.stringify(this.config));
  }

  private showHelp(message: ValidMessage) {
    const helpEmbed = new MessageEmbed()
      .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
      .setDescription(Help.description)
      .addFields(
        Object.entries(Help.commands).map(([name, cmd]) => ({
          name: `${cmd.emoji} ${name}`,
          value: `
            \`${this.config.prefix}${cmd.usage}\`: ${cmd.description}

            Example: \`${this.config.prefix}${cmd.example}\`
          `,
        })),
      );

    message.channel.send({ embeds: [helpEmbed] });
  };
}

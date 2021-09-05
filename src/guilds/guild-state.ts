import { MessageEmbed } from 'discord.js';

import { EndGameReason, GuildConfig, LeaderboardPoints } from '../types/game';
import { ValidMessage } from '../types/discord';
import { HelpCommand } from '../types/bot';

import client from '../client/client';
import spotify from '../spotify/spotify';
import Game from '../game/game';
import Leaderboard from '../leaderboard/leaderboard';

import { isValidMessageWithVoice, parseMessage, sendEmbed } from '../helpers/bot-helpers';
import { parseStartGameArgs, throwIfInsufficientVoicePermissions } from '../helpers/game-helpers';

import Help from '../assets/help.json';
import DefaultConfig from '../assets/default-config.json';

export default class GuildState {
  private config: GuildConfig;
  private game: Game | null;
  private leaderboard: Leaderboard;

  constructor(config = DefaultConfig, leaderboard: LeaderboardPoints = {}) {
    this.config = config;
    this.game = null;
    this.leaderboard = new Leaderboard(leaderboard);
  }

  readMessage(message: ValidMessage) {
    if (message.content.startsWith(this.config.prefix)) {
      this._readCommand(message);
    }

    // Mentioning the bot shows the help menu
    if (message.mentions.has(client.user!.id)) {
      this._help(message);
    }

    // Check guess if the game exists
    this.game?.checkGuess(message);
  }

  private _readCommand(message: ValidMessage) {
    try {
      if (message.content.startsWith(`${this.config.prefix}start`)) {
        this._startGame(message);
      } else if (message.content.startsWith(`${this.config.prefix}stop`)) {
        this._stopGame(message);
      } else if (message.content.startsWith(`${this.config.prefix}skip`)) {
        this._skipGame(message);
      } else if (message.content.startsWith(`${this.config.prefix}leaderboard`)) {
        this._showLeaderboard(message);
      } else if (message.content.startsWith(`${this.config.prefix}config`)) {
        this._showConfig(message);
      } else if (message.content.startsWith(`${this.config.prefix}help`)) {
        this._help(message);
      } else {
        throw new Error(`Invalid command. Use \`${this.config.prefix}help\` for a list of commands.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        sendEmbed(message.channel, error.message);
      }
      console.error('ERROR reading command', error);
    }
  }

  private async _startGame(message: ValidMessage) {
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

    this.game = new Game(
      message,
      this.config,
      tracks,
      (reason: EndGameReason) => this._endGameCallback(reason),
    );
    this.game.startGame();
  }

  private _stopGame(message: ValidMessage) {
    if (!this.game) {
      return sendEmbed(message.channel, 'Nothing to stop here!');
    }
    this.game.endGame('FORCE_STOP');
  }

  private _skipGame(message: ValidMessage) {
    if (!this.game) {
      return sendEmbed(message.channel, 'Nothing to skip here!');
    }
    this.game.skipRound();
  }

  private _endGameCallback(reason: EndGameReason) {
    if (this.game) {
      this.leaderboard.mergeAndIncrementWinners(this.game.leaderboard);
    }
    this.game = null;
  }

  private _showLeaderboard(message: ValidMessage) {
    sendEmbed(message.channel, this.leaderboard.toString());
  }

  private _showConfig(message: ValidMessage) {
    sendEmbed(message.channel, JSON.stringify(this.config));
  }

  private _help(message: ValidMessage) {
    const helpEmbed = new MessageEmbed()
      .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
      .setDescription(Help.description)
      .addFields(Object.entries(Help.commands).map(([name, cmd]) => ({
        name,
        value: `${cmd.emoji} \`${this.config.prefix}${cmd.usage}\`: ${cmd.description}`,
      })));

    message.channel.send({ embeds: [helpEmbed] });
  };
}

import { Config, Leaderboard } from '../types/game';

import DefaultConfig from '../assets/default-config.json';
import { ValidMessage } from '../types/discord';
import Game from '../game/game';
import client from '../client';
import { MessageEmbed } from 'discord.js';
import HelpInstructions from '../assets/help.json';
import { isValidMessageWithVoice, parseMessage, sendEmbed } from '../helpers/bot-helpers';
import spotify from '../spotify/spotify';
import { parseStartGameArgs, throwIfInsufficientVoicePermissions } from '../helpers/start-game-helpers';
import { HelpCommand } from '../types/bot';

export default class GuildManager {
    _config: Config;
    _game: Game | null;
    _leaderboard: Leaderboard;

    constructor(config = DefaultConfig) {
      this._config = config;
      this._game = null;
      this._leaderboard = {};
    }

    readMessage(message: ValidMessage) {
      if (message.content.startsWith(this._config.prefix)) {
        this._readCommand(message);
      }

      // Mentioning the bot shows the help menu
      if (message.mentions.has(client.user!.id)) {
        this._help(message);
      }

      this._game?.checkGuess(message);
    }

    _readCommand(message: ValidMessage) {
      try {
        if (message.content.startsWith(`${this._config.prefix}start`)) {
          this._startGame(message);
        } else if (message.content.startsWith(`${this._config.prefix}stop`)) {
          this._stopGame(message);
        } else if (message.content.startsWith(`${this._config.prefix}skip`)) {
          this._skipGame(message);
        } else if (message.content.startsWith(`${this._config.prefix}leaderboard`)) {
          this._showLeaderboard(message);
        } else if (message.content.startsWith(`${this._config.prefix}config`)) {
          this._showConfig(message);
        } else if (message.content.startsWith(`${this._config.prefix}help`)) {
          this._help(message);
        } else {
          throw new Error(`Invalid command. Use \`${this._config.prefix}help\` for a list of commands.`);
        }
      } catch (error) {
        sendEmbed(message.channel, error.message);
      }
    }

    async _startGame(message: ValidMessage) {
      if (this._game) throw new Error(`There's already a game running!`);

      const args = parseMessage(message);
      const { roundLimit, playlistLinks } = parseStartGameArgs(args, this._config.prefix);

      if (!isValidMessageWithVoice(message)) {
        throw new Error('You need to be in a voice channel to play music');
      }
      throwIfInsufficientVoicePermissions(message);

      // Prepare Spotify
      const playlists = await spotify.getPlaylists(playlistLinks);

      // Initialize game
      const { name, img, tracks } = playlists;
      const tracksLength = Object.keys(tracks).length;
      const newRoundLimit = Math.min(tracksLength, roundLimit);

      const playlistEmbed = new MessageEmbed()
        .setTitle(name)
        .setDescription(`Loading ${newRoundLimit} songs...`)
        .setImage(img ?? '');
      message.channel.send({ embeds: [playlistEmbed] });

      console.log(`${message.guild.name} - #${message.channel.name}: Initializing game of ${newRoundLimit} rounds`);

      this._game = new Game(message, this._config);
      this._game.start();
    }

    _stopGame(message: ValidMessage) {
      if (!this._game) {
        return sendEmbed(message.channel, 'Nothing to stop here!');
      }
      this._game.stop();
    }

    _skipGame(message: ValidMessage) {
      if (!this._game) {
        return sendEmbed(message.channel, 'Nothing to skip here!');
      }
      this._game.skip();
    }

    _showLeaderboard(message: ValidMessage) {
      // TODO
      sendEmbed(message.channel, 'Leaderboard called');
    }

    _showConfig(message: ValidMessage) {
      // TODO
      sendEmbed(message.channel, 'Config called');
    }

    _help(message: ValidMessage) {
      const helpEmbed = new MessageEmbed()
        .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
        .setDescription(HelpInstructions.description)
        .addField(
          'Game commands',
          HelpInstructions.game_commands.map((cmd: HelpCommand) =>
            `${cmd.emoji} \`${this._config.prefix}${cmd.usage}\`: ${cmd.description}`,
          ).join('\n\n'),
        )
        .addField(
          'Help commands',
          HelpInstructions.help_commands.map((cmd: HelpCommand) =>
            `${cmd.emoji} \`${this._config.prefix}${cmd.usage}\`: ${cmd.description}`,
          ).join('\n\n'),
        );

      message.channel.send({ embeds: [helpEmbed] });
    };
}

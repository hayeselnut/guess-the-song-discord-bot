import {
  AudioPlayer,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { MessageEmbed, StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { sendEmbed } from '../helpers/bot-helpers';
import { ValidMessage, ValidMessageWithVoice } from '../types/discord';
import { Callback, EndGameReason, EndRoundReason, GuildConfig } from '../types/game';
import { Tracks } from '../types/tracks';
import AudioResourceBuffer from './audio-resource-buffer';
import Leaderboard from '../leaderboard/leaderboard';
import Round from './round';

export default class Game {
  private starterId: string; // Person who started the game
  private timeLimit: number;
  private emoteNearlyCorrectGuesses: boolean;
  private tracks: Tracks
  private guildId: string;
  private textChannel: TextChannel;
  private voiceChannel: VoiceChannel | StageChannel;

  private currRound: number;
  private finished: boolean;
  readonly leaderboard: Leaderboard;
  private buffer: AudioResourceBuffer;

  private round: Round | null;

  private audioPlayer: AudioPlayer;
  private connection: VoiceConnection;

  private callback: Callback;

  constructor(message: ValidMessageWithVoice, config: GuildConfig, tracks: Tracks, callback: Callback) {
    this.starterId = message.member.id;
    this.timeLimit = config.round_duration;
    this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
    this.tracks = tracks;
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;

    // Game state
    this.currRound = 0;
    this.finished = false;
    this.leaderboard = new Leaderboard();
    this.buffer = new AudioResourceBuffer(this.tracks, this.timeLimit);

    // Round state
    this.round = null;

    this.callback = callback;

    this.audioPlayer = createAudioPlayer();
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        console.log('SHOULD END GAME HERE! //TODO');
        // Manually disconnecting the bot will continue running the game (even shows it in the discord channel)
        // BUG: where if you then $stop it will throw error because cannot destroy a voice connection already destroyed
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        this.connection.destroy();
        this.endGame('DISCONNECTED');
      }
    });
    this.connection.subscribe(this.audioPlayer);
  }

  checkGuess(message: ValidMessage) {
    this.round?.checkGuess(message);
  }

  async startGame() {
    // Wait for buffer to load before starting rounds
    await this.buffer.initializeBuffer();

    this._startRound();
  }

  endGame(reason: EndGameReason, callback?: Callback) {
    this.finished = true;
    console.log(`#${this.textChannel.name}: Game ended with reason ${reason}`);
    this.round = null;

    // TODO should check if connectio nis already destroyed
    this.connection.destroy();

    const gameSummary = new MessageEmbed()
      .setTitle('🏁 Final Leaderboard')
      .setColor('BLUE')
      .setDescription(this.leaderboard.toString());
    this.textChannel.send({ embeds: [gameSummary] });

    if (callback) {
      callback(reason);
    }
  }

  skipRound() {
    console.log('Skip game');
    console.log('only starter id can skip!');
    // TODO
  }

  private _startRound() {
    if (this.finished || this.currRound >= this.timeLimit) {
      return this.endGame('ALL_ROUNDS_PLAYED');
    }

    const audioResource = this.buffer.getNextAudioResourceAndUpdateBuffer();
    if (!audioResource) {
      // TODO handle audio resource is undefined
      return;
    }
    this.round = new Round(
      audioResource,
      this.audioPlayer,
      this.textChannel,
      this.timeLimit,
      (reason: EndRoundReason) => this._endRoundCallback(reason),
    );
    this.round.startRound();
    sendEmbed(this.textChannel, `[${this.currRound + 1}/${this.timeLimit}] Starting next song...`);
  }

  private _endRoundCallback(reason: EndRoundReason) {
    const title = reason === 'CORRECT' ? 'Round summary'
      : reason === 'TIMEOUT' ? 'Too slow! Skipping song...'
        : reason === 'FORCE_SKIP' ? 'Skipping round...'
          // reason === 'LOAD_FAIL'
          : 'Could not load song. Skipping song...';

    if (this.round) {
      this.leaderboard.update(this.round.guesses);
      const roundSummary = new MessageEmbed()
        .setTitle(`[${this.currRound + 1}/${this.timeLimit}] ${title}`)
        .setColor(reason === 'CORRECT' ? 'GREEN' : 'RED')
        .setDescription(this.round.guesses.toResultString())
        .setThumbnail(this.round.track.img)
        .addField('\u200B', '\u200B')
        .addField('🏆 Leaderboard', this.leaderboard.toString());
      this.textChannel.send({ embeds: [roundSummary] });
    }

    this.currRound++;
    this._startRound();
  }
}

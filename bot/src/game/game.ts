import {
  AudioPlayer,
  createAudioPlayer,
  CreateVoiceConnectionOptions,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  JoinVoiceChannelOptions,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { MemberMention, MessageEmbed, StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { sendEmbed } from '../helpers/bot-helpers';
import { ValidMessage, ValidMessageWithVoice } from '../types/discord';
import { EndGameCallback, EndGameReason, EndRoundReason, GuildConfig } from '../types/game';
import { Tracks } from '../types/tracks';
import AudioResourceBuffer from './audio-resource-buffer';
import Leaderboard from '../leaderboard/leaderboard';
import Round from './round';

export default class Game {
  readonly host: MemberMention; // Person who started the game
  private timeLimit: number;
  private roundLimit: number;
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

  private callback: EndGameCallback;

  constructor(message: ValidMessageWithVoice, config: GuildConfig,
    roundLimit: number, tracks: Tracks, callback: EndGameCallback) {
    this.host = message.member.toString();
    this.timeLimit = config.round_duration;
    this.roundLimit = roundLimit;
    this.emoteNearlyCorrectGuesses = config.emote_nearly_correct_guesses;
    this.tracks = tracks;
    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;

    // Game state
    this.currRound = 0;
    this.finished = false;
    this.leaderboard = new Leaderboard();
    this.buffer = new AudioResourceBuffer(this.tracks, this.roundLimit);

    // Round state
    this.round = null;

    this.callback = callback;

    this.audioPlayer = createAudioPlayer()
      .on('error', (error: any) => {
        console.error(`⚠ ERROR with resource ${error.resource.metadata.name}`, error.message);
        this.round?.endRound('LOAD_FAIL');
      });

    this._connectToVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });
  }

  checkGuess(message: ValidMessage) {
    this.round?.checkGuess(message);
  }

  async startGame() {
    // Wait for buffer to load before starting rounds
    await this.buffer.initializeBuffer();
    this._startRound();
  }

  endGame(reason: EndGameReason) {
    this.finished = true;
    this.round?.endRound('FORCE_STOP');
    this.round = null;

    const connection = getVoiceConnection(this.guildId);
    connection?.destroy();

    console.log(`#${this.textChannel.name}: Game ended with reason ${reason}`);

    const gameSummary = new MessageEmbed()
      .setTitle('🏁 Final Leaderboard')
      .setColor('BLUE')
      .setDescription(this.leaderboard.toString());
    this.textChannel.send({ embeds: [gameSummary] });

    this.callback(reason);
  }

  skipRound() {
    this.round?.endRound('FORCE_SKIP');
  }

  private _startRound() {
    if (this.finished || this.currRound >= this.roundLimit) {
      return this.endGame('ALL_ROUNDS_PLAYED');
    }

    const audioResource = this.buffer.getNextAudioResourceAndUpdateBuffer();
    if (!audioResource) {
      console.log(
        `#${this.textChannel.name} [${this.currRound + 1}/${this.roundLimit}]:`,
        `Audio resource was undefined. Restarting round after 2 seconds...`,
      );

      return setTimeout(() => {
        this._startRound();
      }, 2 * 1000);
    }

    this.round = new Round(
      audioResource,
      this.audioPlayer,
      this.textChannel,
      this.timeLimit,
      (reason: EndRoundReason) => this._endRoundCallback(reason),
    );
    this.round.startRound();
    sendEmbed(this.textChannel, `[${this.currRound + 1}/${this.roundLimit}] Starting next song...`);
    console.log(
      `#${this.textChannel.name} [${this.currRound + 1}/${this.roundLimit}]:`,
      this.round.track.name,
      this.round.track.artists,
    );
  }

  private _endRoundCallback(reason: EndRoundReason) {
    const title = reason === 'CORRECT' ? 'Round summary'
      : reason === 'TIMEOUT' ? 'Too slow! Skipping song...'
        : reason === 'FORCE_SKIP' || reason === 'FORCE_STOP' ? 'Skipping round...'
          // reason === 'LOAD_FAIL'
          : 'Could not load song. Skipping song...';

    if (this.round) {
      this.leaderboard.update(this.round.guesses);
      const roundSummary = new MessageEmbed()
        .setTitle(`[${this.currRound + 1}/${this.roundLimit}] ${title}`)
        .setColor(reason === 'CORRECT' ? 'GREEN' : 'RED')
        .setDescription(this.round.guesses.toResultString())
        .setThumbnail(this.round.track.img)
        .addField('\u200B', '\u200B')
        .addField('🏆 Leaderboard', this.leaderboard.toString());
      this.textChannel.send({ embeds: [roundSummary] });
    }

    this.currRound++;

    if (reason !== 'FORCE_STOP') {
      this._startRound();
    }
  }

  private _connectToVoiceChannel(options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions) {
    const connection = joinVoiceChannel(options)
      .on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('Entered disconnected state');
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
          console.log('Reconnection detected');
        } catch (error) {
        // Manually disconnecting the bot will continue running the game (even shows it in the discord channel)
        // BUG: where if you then $stop it will throw error because cannot destroy a voice connection already destroyed
        // Seems to be a real disconnect which SHOULDN'T be recovered from
          console.log('Never reconnected, destroying connection...');
          connection.destroy();
          this.endGame('DISCONNECTED');
        }
      });
    connection.subscribe(this.audioPlayer);
  }
}

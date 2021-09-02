import { AudioPlayer, createAudioPlayer, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { ValidMessage, ValidMessageWithVoice } from '../types/discord';
import { Config } from '../types/game';

const BUFFER_LIMIT = 5;

export default class Game {
  starterId: string;

  guildId: string;
  textChannel: TextChannel;
  voiceChannel: VoiceChannel | StageChannel;

  audioPlayer: AudioPlayer;
  connection: VoiceConnection;

  currRound: number;
  roundLimit: number;

  constructor(message: ValidMessageWithVoice, config: Config) {
    // Person who started the game
    this.starterId = message.member.id;

    this.guildId = message.guild.id;
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;

    this.audioPlayer = createAudioPlayer();
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });
    // TODO HAYES - finish setting this up

    this.currRound = 0;
    this.roundLimit = 0;

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
        // TODO: some command to stop the game
      }
    });
    this.connection.subscribe(this.audioPlayer);

    this.roundLimit = config.round_duration;
  }

  checkGuess(message: ValidMessage) {
    console.log('Checking guess: ', message.content);
  }

  start() {
    console.log('Start game');
  }

  stop() {
    console.log('Stop game');
  }

  skip() {
    console.log('Skip game');
  }
}

import { Message, MessageEmbed, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { sendEmbed } from '../../helpers/discord-helpers.js';
import { shuffle } from '../../helpers/helpers.js';
import Leaderboard from './leaderboard.js';
import Round from './round.js';

import Cookie from '../../assets/cookie.json';
import { Tracks } from '../../types.js';

const BUFFER_LIMIT = 10;

export default class Game {
  guildId: string;
  textChannel: TextChannel;
  voiceChannel: VoiceChannel;
  connection: VoiceConnection | null;
  tracks: Tracks;
  roundDuration: number;
  roundLimit: number;
  order: string[];
  paused: boolean;
  leaderboard: Leaderboard;
  nextRounds: Round[];
  round: Round | null | undefined;
  currRound: number;
  callback: any;

  constructor(message: Message, tracks: Tracks, roundLimit: number, roundDuration: number, callback: any) {
    // Discord things
    this.guildId = message.guild.id;
    this.textChannel = message.channel as TextChannel;
    this.voiceChannel = message.member.voice.channel;
    this.connection = null;

    // Game
    this.tracks = tracks;
    this.roundDuration = roundDuration;
    this.roundLimit = roundLimit;
    this.order = shuffle(Object.keys(tracks)).slice(0, this.roundLimit);
    this.paused = false;
    this.leaderboard = new Leaderboard();

    // Round buffers (this helps the discord bot play a song instantly instead of waiting for await to finish)
    this.nextRounds = []; // Buffer of next rounds containing preloaded streams

    // Round things
    this.round = null;
    this.currRound = 0;

    this.callback = callback;
  }

  async startGame() {
    console.log(`#${this.textChannel.name}: Starting game`);
    await this._connectToVoiceChannel();

    // Load buffer of next 3 streams
    for (let i = 0; i < Math.min(BUFFER_LIMIT, this.roundLimit); i++) {
      await this._loadBufferRound(i);
    }
    this._startRound();
  }

  checkGuess(message: Message) {
    if (this.round == null) {
      return console.error('Could not check guess with empty round');
    };
    this.round.checkGuess(message);
  }

  async _loadBufferRound(index: number) {
    const trackId = this.order[index];
    if (!trackId) {
      return console.warn('Tried to buffer more rounds than required');
    };

    const track = this.tracks[trackId];
    const youtubeQuery = `${track.name} ${track.artists.join(' ')}`;
    const youtubeResults = await yts(youtubeQuery);
    const video = youtubeResults.videos[0];
    const stream = ytdl(video.url, {
      filter: 'audioonly',
      requestOptions: {
        headers: Cookie,
      },
    }).on('error', (err) => {
      console.error(err);

      // If error, we set the stream to null so that it is invalid in the round and the round is skipped.
      for (let i = 0; i < this.nextRounds.length; i++) {
        if (trackId != this.nextRounds[i].track.id) continue;
        this.nextRounds[i].stream = null;
      }
    });

    const round = new Round(track, stream, this.connection, this.textChannel, this.roundDuration, (title) => {
      this._endRound(title);
    });
    this.nextRounds.push(round);
  }

  _startRound() {
    if (this.currRound >= this.roundLimit) {
      return this.endGame();
    }

    this.round = this.nextRounds.shift();
    if (!this.round) {
      console.error('Could not load round from empty buffer');
      sendEmbed(this.textChannel, 'Could not load round from empty buffer');
      return;
    }
    sendEmbed(this.textChannel, `[${this.currRound + 1}/${this.roundLimit}] Starting next song...`);
    this.round.startRound();
  }

  // This function is provided as a callback to the round.
  _endRound(title = 'Round summary') {
    // Load next buffer round if possible
    if (this.currRound + BUFFER_LIMIT < this.roundLimit) {
      this._loadBufferRound(this.currRound + BUFFER_LIMIT);
    }

    if (this.round) {
      // Display round results and current leaderboard
      this.leaderboard.update(this.round.guesses);
      const roundSummary = new MessageEmbed()
        .setTitle(title)
        .setColor(title === 'Round summary' ? '#2ECC71' : '#E91E63')
        .setDescription(this.round.guesses.toString(true))
        .setThumbnail(this.round.track?.img)
        .addField('\u200B', '\u200B')
        .addField('🏆 Leaderboard', this.leaderboard.toString());
      this.textChannel.send({ embed: roundSummary });
    }

    this.currRound++;
    this._startRound();
  }

  skipRound() {
    this.round?.endRound(false);
    this._endRound('Skipping round...');
  }

  async _connectToVoiceChannel() {
    try {
      this.connection = await this.voiceChannel.join();
    } catch (err) {
      console.error(err);
      sendEmbed(this.textChannel, 'Could not join voice channel 😞');
      this.connection = null;
      this.endGame();
    }
  }

  endGame(useCallback=true) {
    console.log(`#${this.textChannel.name}: Game ended ${useCallback ? 'naturally' : 'manually'}`);

    this.currRound = this.roundLimit;
    this.voiceChannel.leave();
    this.round?.endRound(false);
    this.round = null;
    this.connection = null;

    const gameSummary = new MessageEmbed()
      .setTitle('🏁 Final Leaderboard')
      .setColor('#3498DB')
      .setDescription(this.leaderboard.toString());
    this.textChannel.send({ embed: gameSummary });

    if (!useCallback) return;

    this.callback();
  }
}
import { Guild, GuildMember, Message, TextChannel, VoiceChannel, VoiceState } from 'discord.js';

export type Track = {
    id: string,
    name: string,
    artists: string[],
    img: string,
    normalizedName: string,
    normalizedArtists: string[],
  };

export type Tracks = {
  [id: string]: Track
};

export type Playlist = {
  name: string,
  img: string | undefined,
  tracks: Tracks,
}

export type HelpCommand = {emoji: string, usage: string, description: string}

export type Config = {
  prefix: string,
  round_duration: number,
  emote_nearly_correct_guesses: boolean,
  leaderboard: { [id: string]: number },
}

export interface ValidMessage extends Message {
  channel: TextChannel,
  guild: Guild,
  member: GuildMember,
}

export interface VoiceStateWithVoiceChannel extends VoiceState {
  channel: VoiceChannel
}

export interface GuildMemberWithVoiceChannel extends GuildMember {
  voice: VoiceStateWithVoiceChannel
}

export interface ValidMessageWithVoiceChannel extends ValidMessage {
  member: GuildMemberWithVoiceChannel
}

import { Guild, GuildMember, Message, StageChannel, TextChannel, VoiceChannel, VoiceState } from 'discord.js';

export interface ValidMessage extends Message {
  channel: TextChannel,
  guild: Guild,
  member: GuildMember,
}

export interface VoiceStateWithVoice extends VoiceState {
  channel: VoiceChannel | StageChannel
}

export interface GuildMemberWithVoice extends GuildMember {
  voice: VoiceStateWithVoice
}

export interface ValidMessageWithVoice extends ValidMessage {
  member: GuildMemberWithVoice
}

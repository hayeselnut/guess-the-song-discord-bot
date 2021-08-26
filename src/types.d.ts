import { Guild, GuildMember, Message, TextChannel, User } from "discord.js";

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

export interface ReadableMessage extends Message {
  channel: TextChannel,
  guild: Guild,
  member: GuildMember,
}
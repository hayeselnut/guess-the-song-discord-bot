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

export type track = {
    id: string,
    name: string,
    artists: string[],
    img: string,
    normalizedName: string,
    normalizedArtists: string[],
  };

  export type tracks = {
    [id: string]: track
  }
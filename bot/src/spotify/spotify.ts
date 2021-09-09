import SpotifyWebApi from 'spotify-web-api-node';
import { Track, Tracks, Playlist } from '../types/tracks';
import { normalizeTrack } from '../helpers/normalize-helpers';

class Spotify {
  private readonly api: SpotifyWebApi;

  constructor(clientId: string, clientSecret: string) {
    this.api = new SpotifyWebApi({ clientId, clientSecret });
  }

  public async getPlaylists(playlistLinks: string[]): Promise<Playlist> {
    await this.retrieveAccessToken();

    const playlists = (await Promise.all(playlistLinks.map((link) => this.getPlaylist(link))))
      .filter((playlist): playlist is Playlist => playlist !== undefined);

    if (playlists.length === 0) {
      throw new Error('No tracks found');
    };

    return {
      name: playlists.map((playlist) => playlist.name).join(' + '), // Show all names joined by ` + `
      img: playlists.find((playlist) => playlist.img !== null && playlist.img !== undefined)?.img,
      tracks: playlists.reduce((acc, playlist) => {
        return { ...acc, ...playlist.tracks };
      }, {}),
    };
  }

  private async getPlaylist(playlistLink: string): Promise<Playlist | undefined> {
    try {
      const playlistId = this.parsePlaylistLink(playlistLink);
      const playlistData = await this.api.getPlaylist(playlistId);
      const tracks = await this.getTracksFromPlaylist(playlistId);

      console.log(`Retrieved ${Object.entries(tracks).length} songs from ${playlistLink}`);

      return {
        name: playlistData.body.name,
        img: playlistData.body.images[0]?.url,
        tracks: tracks,
      };
    } catch (err) {
      return undefined;
    }
  }

  private async retrieveAccessToken() {
    const data = await this.api.clientCredentialsGrant();

    // Save the access token so that it's used in future calls
    this.api.setAccessToken(data.body.access_token);
  }

  private async getTracksFromPlaylist(playlistId: string, offset: number = 0): Promise<Tracks> {
    const data = await this.api.getPlaylistTracks(playlistId, { offset });
    const tracks = data.body.items.map((trackData) => {
      const { normalizedName, normalizedArtists } = normalizeTrack(
        trackData.track.name, trackData.track.artists.map((artistData) => artistData.name),
      );

      return {
        id: trackData.track.id,
        name: trackData.track.name,
        artists: trackData.track.artists.map((artistData) => artistData.name),
        img: trackData.track.album.images[0]?.url,
        normalizedName,
        normalizedArtists,
      };
    }).reduce((acc: Tracks, track: Track) => {
      acc[track.id] = track;
      return acc;
    }, {});

    return data.body.next
      ? { ...tracks, ...(await this.getTracksFromPlaylist(playlistId, data.body.offset + data.body.limit)) }
      : tracks;
  }

  private parsePlaylistLink(playlistLink: string) {
    if (playlistLink.includes('playlist/')) {
      playlistLink = playlistLink.split('playlist/')[1];
    }

    if (playlistLink.includes('?')) {
      playlistLink = playlistLink.split('?')[0];
    }

    return playlistLink;
  };
}

export default new Spotify(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
);

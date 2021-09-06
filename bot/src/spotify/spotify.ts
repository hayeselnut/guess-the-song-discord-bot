import SpotifyWebApi from 'spotify-web-api-node';
import { normalizeTrack } from '../helpers/normalize-helpers';
import { Track, Tracks, Playlist } from '../types/tracks';

class Spotify {
  api: SpotifyWebApi;

  constructor(clientId: string, clientSecret: string) {
    this.api = new SpotifyWebApi({ clientId, clientSecret });
  }

  async getPlaylists(playlistLinks: string[]): Promise<Playlist> {
    await this._retrieveAccessToken();

    const playlists = (await Promise.all(playlistLinks.map((link) => this._getPlaylist(link))))
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

  async _getPlaylist(playlistLink: string): Promise<Playlist | undefined> {
    try {
      const playlistId = this._parsePlaylistLink(playlistLink);
      const playlistData = await this.api.getPlaylist(playlistId);
      const tracks = await this._getTracksFromPlaylist(playlistId);

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

  async _retrieveAccessToken() {
    const data = await this.api.clientCredentialsGrant();

    // Save the access token so that it's used in future calls
    this.api.setAccessToken(data.body.access_token);
  }

  async _getTracksFromPlaylist(playlistId: string, offset: number = 0): Promise<Tracks> {
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
      ? { ...tracks, ...(await this._getTracksFromPlaylist(playlistId, data.body.offset + data.body.limit)) }
      : tracks;
  }

  _parsePlaylistLink(playlistLink: string) {
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

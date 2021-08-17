/* eslint-disable require-jsdoc */
import SpotifyWebApi from 'spotify-web-api-node';
import { normalizeTrack } from './helpers/normalize-helpers.js';

export default class Spotify {
  constructor(clientId, clientSecret) {
    this.api = new SpotifyWebApi({ clientId, clientSecret });
  }

  async getPlaylist(playlistLink) {
    await this._retrieveAccessToken();

    const playlistId = this._parsePlaylistLink(playlistLink);
    const playlistData = await this.api.getPlaylist(playlistId);
    const tracks = await this._getTracksFromPlaylist(playlistId);

    return {
      id: playlistId,
      name: playlistData.body.name,
      img: playlistData.body.images[0]?.url,
      tracks: tracks,
    };
  }

  async _retrieveAccessToken() {
    const data = await this.api.clientCredentialsGrant();
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    this.api.setAccessToken(data.body.access_token);
  }

  async _getTracksFromPlaylist(playlistId, offset=0) {
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
    }).reduce((acc, track) => {
      acc[track.id] = track;
      return acc;
    }, {});

    return data.body.next
      ? { ...tracks, ...(await this._getTracksFromPlaylist(playlistId, data.body.offset + data.body.limit)) }
      : tracks;
  }

  _parsePlaylistLink(playlistLink) {
    if (playlistLink.includes('playlist/')) {
      playlistLink = playlistLink.split('playlist/')[1];
    }

    if (playlistLink.includes('?')) {
      playlistLink = playlistLink.split('?')[0];
    }

    return playlistLink;
  };
}

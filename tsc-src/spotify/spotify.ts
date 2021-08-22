/* eslint-disable require-jsdoc */
import SpotifyWebApi from 'spotify-web-api-node';
import { normalizeTrack } from '../helpers/normalize-helpers';
import { track } from '../types';

type tracks {
  [id: string]: track
}

export default class Spotify {
  constructor(clientId: string, clientSecret: string) {
    this.api = new SpotifyWebApi({ clientId, clientSecret });
  }

  async getPlaylists(playlistLinks: string[]) {
    await this._retrieveAccessToken();

    const allPlaylists = (await Promise.all(playlistLinks.map((link) => this._getPlaylist(link))))
      .filter((playlist) => playlist != undefined && playlist.name != null);

    return {
      name: allPlaylists.map((playlist) => playlist.name).join(' + '), // Show all names joined by ` + `
      img: allPlaylists.find((playlist) => playlist.img !== null && playlist.img !== undefined)?.img,
      tracks: allPlaylists.reduce((acc, playlist) => {
        return { ...acc, ...playlist.tracks };
      }, {}),
    };
  }

  async _getPlaylist(playlistLink: string) {
    try {
      const playlistId = this._parsePlaylistLink(playlistLink);
      const playlistData = await this.api.getPlaylist(playlistId);
      const tracks = await this._getTracksFromPlaylist(playlistId);

      return {
        name: playlistData.body.name,
        img: playlistData.body.images[0]?.url,
        tracks: tracks,
      };
    } catch (err) {
      return {
        name: null,
        img: null,
        tracks: null,
      };
    }
  }

  async _retrieveAccessToken() {
    const data = await this.api.clientCredentialsGrant();
    console.log('The Spotify access token expires in ' + data.body['expires_in']);
    console.log('The Spotify access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    this.api.setAccessToken(data.body.access_token);
  }

  async _getTracksFromPlaylist(playlistId: string, offset: number = 0) {
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
    }).reduce((acc: tracks, track: track) => {
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

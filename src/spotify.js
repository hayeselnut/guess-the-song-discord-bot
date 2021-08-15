/* eslint-disable require-jsdoc */
import SpotifyWebApi from 'spotify-web-api-node';

export default class Spotify {
  constructor(clientId, clientSecret) {
    this.api = new SpotifyWebApi({ clientId, clientSecret });
    this.retrieveAccessToken();
  }

  async retrieveAccessToken() {
    const data = await this.api.clientCredentialsGrant();
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    this.api.setAccessToken(data.body['access_token']);
  }

  async getPlaylist(playlistLink) {
    const playlistId = this.parsePlaylistLink(playlistLink);
    const playlistData = await this.api.getPlaylist(playlistId);
    const tracks = await this.getTracksFromPlaylist(playlistId);

    console.log(tracks);

    return {
      name: playlistData.body.name,
      tracks: tracks,
    };
  }

  async getTracksFromPlaylist(playlistId, offset=0) {
    const data = await this.api.getPlaylistTracks(playlistId, { offset });
    console.log(data);
    const tracks = data.body.items.map((trackData) => ({
      id: trackData.track.id,
      name: trackData.track.name,
      artists: trackData.track.artists.map((artistData) => artistData.name),
    })).reduce((acc, track) => {
      acc[track.id] = track;
      return acc;
    }, {});

    return data.body.next ? { ...tracks, ...(await this.getTracksFromPlaylist(playlistId, data.body.offset + data.body.limit)) } : tracks;
  }

  parsePlaylistLink(playlistLink) {
    if (playlistLink.includes('playlist/')) {
      playlistLink = playlistLink.split('playlist/')[1];
    }

    if (playlistLink.includes('?')) {
      playlistLink = playlistLink.split('?')[0];
    }

    return playlistLink;
  };
}

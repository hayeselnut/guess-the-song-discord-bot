"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const normalize_helpers_1 = require("../helpers/normalize-helpers");
class Spotify {
    constructor(clientId, clientSecret) {
        this.api = new spotify_web_api_node_1.default({ clientId, clientSecret });
    }
    async getPlaylists(playlistLinks) {
        await this.retrieveAccessToken();
        const playlists = (await Promise.all(playlistLinks.map((link) => this.getPlaylist(link))))
            .filter((playlist) => playlist !== undefined);
        if (playlists.length === 0) {
            throw new Error('No tracks found');
        }
        ;
        return {
            name: playlists.map((playlist) => playlist.name).join(' + '),
            img: playlists.find((playlist) => playlist.img !== null && playlist.img !== undefined)?.img,
            tracks: playlists.reduce((acc, playlist) => {
                return { ...acc, ...playlist.tracks };
            }, {}),
        };
    }
    async getPlaylist(playlistLink) {
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
        }
        catch (err) {
            return undefined;
        }
    }
    async retrieveAccessToken() {
        const data = await this.api.clientCredentialsGrant();
        // Save the access token so that it's used in future calls
        this.api.setAccessToken(data.body.access_token);
    }
    async getTracksFromPlaylist(playlistId, offset = 0) {
        const data = await this.api.getPlaylistTracks(playlistId, { offset });
        const tracks = data.body.items.map((trackData) => {
            const { normalizedName, normalizedArtists } = (0, normalize_helpers_1.normalizeTrack)(trackData.track.name, trackData.track.artists.map((artistData) => artistData.name));
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
            ? { ...tracks, ...(await this.getTracksFromPlaylist(playlistId, data.body.offset + data.body.limit)) }
            : tracks;
    }
    parsePlaylistLink(playlistLink) {
        if (playlistLink.includes('playlist/')) {
            playlistLink = playlistLink.split('playlist/')[1];
        }
        if (playlistLink.includes('?')) {
            playlistLink = playlistLink.split('?')[0];
        }
        return playlistLink;
    }
    ;
}
exports.default = new Spotify(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

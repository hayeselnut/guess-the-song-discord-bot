"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrack = exports.normalize = exports.removeAdditionalInformation = void 0;
const removeAdditionalInformation = (str) => str.replace(/\(.*/g, '')
    .replace(/\[.*/g, '')
    .replace(/\{.*/g, '')
    .replace(/ - .*/g, '')
    .replace(/feat\. .*/g, '')
    .replace(/ft\. .*/g, '');
exports.removeAdditionalInformation = removeAdditionalInformation;
const normalize = (str, type) => {
    let normalized = str.normalize('NFD').toLowerCase();
    if (type == 'name') {
        normalized = exports.removeAdditionalInformation(normalized);
        normalized = normalized
            .replace('f**k', 'fuck'); // F**king Perfect
    }
    else if (type == 'artist') {
        normalized = normalized
            .replace('a$ap', 'asap') // A$AP Rocky
            .replace('mø', 'mo') // MØ
            .replace('p!nk', 'pink'); // P!nk
    }
    return normalized
        .replace('0', 'zero')
        .replace('1', 'one')
        .replace('2', 'two')
        .replace('3', 'three')
        .replace('4', 'four')
        .replace('5', 'five')
        .replace('6', 'six')
        .replace('7', 'seven')
        .replace('8', 'eight')
        .replace('9', 'nine')
        .replace(' & ', ' and ')
        .replace(/^the /g, '')
        .replace(/[^a-z0-9]/g, '') || str;
};
exports.normalize = normalize;
const normalizeTrack = (name, artists) => {
    const normalizedArtists = artists.map((artist) => exports.normalize(artist, 'artist'));
    const normalizedName = exports.normalize(name, 'name');
    return { normalizedName, normalizedArtists };
};
exports.normalizeTrack = normalizeTrack;

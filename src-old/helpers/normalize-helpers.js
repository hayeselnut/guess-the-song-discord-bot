"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrack = exports.normalize = exports.removeAdditionalInformation = void 0;
const removeAdditionalInformation = (str) => str.replaceAll(/\(.*\)/g, '')
    .replaceAll(/\[.*\]/g, '')
    .replaceAll(/\{.*\}/g, '')
    .replaceAll(/ - .*/g, '')
    .replaceAll(/ feat\. .*/g, '')
    .replaceAll(/ ft\. .*/g, '')
    .replaceAll('**', '\\*\\*')
    .trim();
exports.removeAdditionalInformation = removeAdditionalInformation;
const normalize = (str, type) => {
    let normalized = str.normalize('NFD').toLowerCase();
    if (type == 'name') {
        normalized = (0, exports.removeAdditionalInformation)(normalized);
        normalized = normalized
            .replaceAll('ni\\*\\*as', 'niggas') // Ni**as in Paris - JAY-Z, Kanye West
            .replaceAll('f\\*\\*k', 'fuck'); // F**king Perfect - P!nk
    }
    else if (type == 'artist') {
        normalized = normalized
            .replaceAll('a$ap', 'asap') // A$AP Rocky
            .replaceAll('mø', 'mo') // MØ
            .replaceAll('p!nk', 'pink'); // P!nk
    }
    return normalized
        .replaceAll(/0/g, 'zero')
        .replaceAll(/1/g, 'one')
        .replaceAll(/2/g, 'two')
        .replaceAll(/3/g, 'three')
        .replaceAll(/4/g, 'four')
        .replaceAll(/5/g, 'five')
        .replaceAll(/6/g, 'six')
        .replaceAll(/7/g, 'seven')
        .replaceAll(/8/g, 'eight')
        .replaceAll(/9/g, 'nine')
        .replaceAll(' & ', ' and ')
        .replace(/^the /g, '')
        .replace(/[^a-z0-9]/g, '') || str;
};
exports.normalize = normalize;
const normalizeTrack = (name, artists) => {
    const normalizedArtists = artists.map((artist) => (0, exports.normalize)(artist, 'artist'));
    const normalizedName = (0, exports.normalize)(name, 'name');
    return { normalizedName, normalizedArtists };
};
exports.normalizeTrack = normalizeTrack;

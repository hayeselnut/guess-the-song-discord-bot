export const removeAdditionalInformation = (str) =>
  str.replace(/\(.*/g, '')
    .replace(/\[.*/g, '')
    .replace(/\{.*/g, '')
    .replace(/-.*/g, '')
    .replace(/feat\. .*/g)
    .replace(/ft\. .*/g);

export const normalize = (str, type) => {
  let normalized = str.normalize('NFD').toLowerCase();

  if (type == 'name') {
    normalized = removeAdditionalInformation(normalized);
    normalized = normalized
      .replace('f**k', 'fuck'); // F**king Perfect
  } else if (type == 'artist') {
    normalized = normalized
      .replace('a$ap', 'asap') // A$AP Rocky
      .replace('mø', 'mo') // MØ
      .replace('p!nk', 'pink'); // P!nk
  }

  return normalized
    .replace(' & ', ' and ')
    .replace(/[^a-z0-9]/g, '') || str;
};

export const normalizeTrack = (name, artists) => {
  const normalizedArtists = artists.map((artist) => normalize(artist, 'artist'));
  const normalizedName = normalize(name, 'name');

  return { normalizedName, normalizedArtists };
};

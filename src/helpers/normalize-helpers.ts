type NormalizeTypes = 'name' | 'artist';

type NormalizedTrack = {
  normalizedName: string,
  normalizedArtists: string[],
}

export const removeAdditionalInformation = (str: string): string =>
  str.replace(/\(.*\)/g, '')
    .replace(/\[.*\]/g, '')
    .replace(/\{.*\}/g, '')
    .replace(/ - .*/g, '')
    .replace(/feat\. .*/g, '')
    .replace(/ft\. .*/g, '');

export const normalize = (str: string, type: NormalizeTypes): string => {
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

export const normalizeTrack = (name: string, artists: string[]): NormalizedTrack => {
  const normalizedArtists = artists.map((artist) => normalize(artist, 'artist'));
  const normalizedName = normalize(name, 'name');

  return { normalizedName, normalizedArtists };
};

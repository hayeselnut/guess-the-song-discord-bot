type NormalizeTypes = 'name' | 'artist';

type NormalizedTrack = {
  normalizedName: string,
  normalizedArtists: string[],
}

export const censorArtists = (name: string, artists: string[]) => {
  // Assumes the artist's name is printed exactly in title
  let censoredName = name;
  artists.forEach((artist) => {
    censoredName = censoredName
      .replaceAll(new RegExp(`\\(.*${artist}.*\\)`, 'g'), '')
      .replaceAll(new RegExp(`\\[.*${artist}.*\\]`, 'g'), '')
      .replaceAll(new RegExp(`\\{.*${artist}.*\\}`, 'g'), '')
      .replaceAll(new RegExp(` - .*${artist}.*`, 'g'), '')
      .replaceAll(new RegExp(` feat\\. .*${artist}.*`, 'g'), '')
      .replaceAll(new RegExp(` ft\\. .*${artist}.*`, 'g'), '');
  });

  return censoredName.replaceAll('**', '\\*\\*').trim();
};

export const removeAdditionalInformation = (str: string): string =>
  str.replaceAll(/\(.*\)/g, '')
    .replaceAll(/\[.*\]/g, '')
    .replaceAll(/\{.*\}/g, '')
    .replaceAll(/ - .*/g, '')
    .replaceAll(/ feat\. .*/g, '')
    .replaceAll(/ ft\. .*/g, '')
    .replaceAll('**', '\\*\\*')
    .trim();

export const normalize = (str: string, type: NormalizeTypes): string => {
  let normalized = str.normalize('NFD').toLowerCase();

  if (type == 'name') {
    normalized = removeAdditionalInformation(normalized);
    normalized = normalized
      .replaceAll('ni\\*\\*as', 'niggas') // Ni**as in Paris - JAY-Z, Kanye West
      .replaceAll('f\\*\\*k', 'fuck'); // F**king Perfect - P!nk
  } else if (type == 'artist') {
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

export const normalizeTrack = (name: string, artists: string[]): NormalizedTrack => {
  const normalizedArtists = artists.map((artist) => normalize(artist, 'artist'));
  const normalizedName = normalize(name, 'name');

  return { normalizedName, normalizedArtists };
};

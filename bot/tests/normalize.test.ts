import { censorArtists, normalize, removeAdditionalInformation } from '../src/helpers/normalize-helpers';

describe('normalize song names', () => {
  it('simple', () => {
    expect(normalize('Sorry', 'name')).toBe('sorry');
    expect(normalize('Somebody To You', 'name')).toBe('somebodytoyou');
  });

  it('accents', () => {
    expect(normalize('Señorita', 'name')).toBe('senorita');
  });

  it('numbers', () => {
    expect(normalize('22', 'name')).toBe('twotwo');
    expect(normalize('7 Years', 'name')).toBe('sevenyears');
    expect(normalize('2002', 'name')).toBe('twozerozerotwo');
    expect(normalize('24K Magic', 'name')).toBe('twofourkmagic');
    expect(normalize('Like A G6', 'name')).toBe('likeagsix');
  });

  it(('brackets'), () => {
    expect(normalize('Love Is Madness (feat. Halsey)', 'name')).toBe('loveismadness');
    expect(normalize('Titanium (feat. Sia)', 'name')).toBe('titanium');
    expect(normalize('Airplanes (feat. Hayley Williams of Paramore)', 'name')).toBe('airplanes');
    expect(normalize('Forever ... (is a long time)', 'name')).toBe('forever');
    expect(normalize('Stronger (What Doesn\'t Kill You)', 'name')).toBe('stronger');
    expect(normalize('(You Drive Me) Crazy', 'name')).toBe('crazy');
    expect(normalize('(You Drive Me) Crazy - The Stop Remix!', 'name')).toBe('crazy');
  });

  it(('punctuation'), () => {
    expect(normalize('I Won\'t Give Up', 'name')).toBe('iwontgiveup');
    expect(normalize('HUMBLE.', 'name')).toBe('humble');
  });

  it(('&'), () => {
    expect(normalize('His & Hers', 'name')).toBe('hisandhers');
  });

  it(('hyphens'), () => {
    expect(normalize('Can\'t Hold Us - feat. Ray Dalton', 'name')).toBe('cantholdus');
    expect(normalize('CAN\'T STOP THE FEELING! (Original Song from DreamWorks Animation\'s "TROLLS")', 'name')).toBe('cantstopthefeeling');
    expect(normalize('Earned It (Fifty Shades Of Grey) - From The "Fifty Shades Of Grey" Soundtrack', 'name')).toBe('earnedit');
    expect(normalize('DDU-DU DDU-DU', 'name')).toBe('ddududdudu');
    expect(normalize('Like Ooh-Ahh', 'name')).toBe('likeoohahh');
  });

  it(('**'), () => {
    expect(normalize('F**kin\' Problems (feat. Drake, 2 Chainz & Kendrick Lamar)', 'name')).toBe('fuckinproblems');
    expect(normalize('Ni**as In Paris', 'name')).toBe('niggasinparis');
    expect(normalize('F**kin\' Perfect', 'name')).toBe('fuckinperfect');
    expect(normalize('Une**pected', 'name')).toBe('unepected');
    expect(normalize('FXXK IT', 'name')).toBe('fxxkit');
  });

  it(('kpop'), () => {
    expect(normalize('눈,코,입 (Eyes, Nose, Lips)', 'name')).toBe('눈,코,입 (Eyes, Nose, Lips)');
  });

  it(('`the ` prefix'), () => {
    expect(normalize('The Nights', 'name')).toBe('nights');
    expect(normalize('The Hills', 'name')).toBe('hills');
  });
});

describe('normalize artists', () => {
  it('simple', () => {
    expect(normalize('Britney Spears', 'artist')).toBe('britneyspears');
    expect(normalize('Justin Bieber', 'artist')).toBe('justinbieber');
    expect(normalize('Miley Cyrus', 'artist')).toBe('mileycyrus');
    expect(normalize('BTS', 'artist')).toBe('bts');
    expect(normalize('V', 'artist')).toBe('v');
  });

  it('numbers', () => {
    expect(normalize('The Jackson 5', 'artist')).toBe('jacksonfive');
    expect(normalize('015B', 'artist')).toBe('zeroonefiveb');
    expect(normalize('10cm', 'artist')).toBe('onezerocm');
    expect(normalize('BOL4', 'artist')).toBe('bolfour');
    expect(normalize('50 cent', 'artist')).toBe('fivezerocent');
  });

  it('replacement letters', () => {
    expect(normalize('A$AP Rocky', 'artist')).toBe('asaprocky');
    expect(normalize('P!nk', 'artist')).toBe('pink');
    expect(normalize('MØ', 'artist')).toBe('mo');
  });

  it(('punctuation'), () => {
    expect(normalize('D.O.', 'artist')).toBe('do');
    expect(normalize('G.E.M.', 'artist')).toBe('gem');
    expect(normalize('Olivia O\'Brien', 'artist')).toBe('oliviaobrien');
    expect(normalize('R. City', 'artist')).toBe('rcity');
    expect(normalize('Ruth B.', 'artist')).toBe('ruthb');
    expect(normalize('Portugal. The Man', 'artist')).toBe('portugaltheman');
    expect(normalize('Ne-Yo', 'artist')).toBe('neyo');
    expect(normalize('T-Pain', 'artist')).toBe('tpain');
    expect(normalize('JAY-Z', 'artist')).toBe('jayz');
  });

  it(('&'), () => {
    expect(normalize('Macklemore & Ryan Lewis', 'artist')).toBe('macklemoreandryanlewis');
  });

  it(('`the ` prefix'), () => {
    expect(normalize('The Weeknd', 'artist')).toBe('weeknd');
    expect(normalize('The VANE', 'artist')).toBe('vane');
    expect(normalize('The Chainsmokers', 'artist')).toBe('chainsmokers');
    expect(normalize('Chance the Rapper', 'artist')).toBe('chancetherapper');
  });

  it(('foreign'), () => {
    expect(normalize('南征北戰', 'artist')).toBe('南征北戰');
  });
});

describe('display name', () => {
  it(('escaping `**`'), () => {
    expect(removeAdditionalInformation('F**kin\' Problems (feat. Drake, 2 Chainz & Kendrick Lamar)')).toBe('F\\*\\*kin\' Problems');
    expect(removeAdditionalInformation('Ni**as In Paris')).toBe('Ni\\*\\*as In Paris');
    expect(removeAdditionalInformation('F**kin\' Perfect')).toBe('F\\*\\*kin\' Perfect');
    expect(removeAdditionalInformation('Une**pected')).toBe('Une\\*\\*pected');
    expect(removeAdditionalInformation('FXXK IT')).toBe('FXXK IT');
  });

  it(('brackets'), () => {
    expect(removeAdditionalInformation('Love Is Madness (feat. Halsey)')).toBe('Love Is Madness');
    expect(removeAdditionalInformation('Titanium (feat. Sia)')).toBe('Titanium');
    expect(removeAdditionalInformation('Airplanes (feat. Hayley Williams of Paramore)')).toBe('Airplanes');
    expect(removeAdditionalInformation('Forever ... (is a long time)')).toBe('Forever ...');
    expect(removeAdditionalInformation('Stronger (What Doesn\'t Kill You)')).toBe('Stronger');
    expect(removeAdditionalInformation('(You Drive Me) Crazy')).toBe('Crazy');
    expect(removeAdditionalInformation('(You Drive Me) Crazy - The Stop Remix!')).toBe('Crazy');
  });

  it(('censor artists in song name'), () => {
    expect(censorArtists('F**kin\' Problems (feat. Drake, 2 Chainz & Kendrick Lamar)', ['Drake', '2 Chainz', 'Kendrick Lamar'])).toBe('F\\*\\*kin\' Problems');
    expect(censorArtists('Titanium (feat. Sia)', ['Sia'])).toBe('Titanium');
    expect(censorArtists('Airplanes (feat. Hayley Williams of Paramore)', ['Hayley Williams'])).toBe('Airplanes');
    expect(censorArtists('(You Drive Me) Crazy', ['Britney Spears'])).toBe('(You Drive Me) Crazy');
    expect(censorArtists('(You Drive Me) Crazy - The Stop Remix!', ['Britney Spears'])).toBe('(You Drive Me) Crazy - The Stop Remix!');
    expect(censorArtists('Forever ... (is a long time)', ['Halsey'])).toBe('Forever ... (is a long time)');
    expect(censorArtists('Stronger (What Doesn\'t Kill You)', ['Kelly Clarsson'])).toBe('Stronger (What Doesn\'t Kill You)');
    expect(censorArtists('Earned It (Fifty Shades Of Grey) - From The "Fifty Shades Of Grey" Soundtrack', ['The Weeknd'])).toBe('Earned It (Fifty Shades Of Grey) - From The "Fifty Shades Of Grey" Soundtrack');
    expect(censorArtists('CAN\'T STOP THE FEELING! (Original Song from DreamWorks Animation\'s "TROLLS")', ['Justin Timberlake'])).toBe('CAN\'T STOP THE FEELING! (Original Song from DreamWorks Animation\'s "TROLLS")');
  });
});

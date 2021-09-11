import React from 'react';
import { Container, Image, Tooltip } from 'react-bootstrap';
import InviteButton from './components/invite-button';
import TopGGButton from './components/top-gg-button';

import './App.css';

import Bird from './assets/bird.svg';
import GuessingExample from './assets/guessing.png';

const App = () => {
  const scrollToFeatures = () => {
    document.getElementById('spotify-integration')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header>
        <Container className='debug'>
          <div className='title-display debug'>
            <div className='titles'>
              <h1>
                <div className='gradientText'>Guess the Song</div>
                <div>discord bot</div>
              </h1>
            </div>
            <Image src={Bird} className='bird' />
          </div>

          <div className='buttons debug'>
            <InviteButton />
            <TopGGButton />
          </div>

          <div className='arrow floating debug'>
            <i className="bi bi-arrow-down" onClick={scrollToFeatures} />
          </div>
        </Container>

      </header>

      <section id='spotify-integration'>
        <Container className='center debug'>
          <h2 className='feature-title'>Spotify integration</h2>
          <p className='feature-caption'>Create a game with any Spotify playlist</p>
          <div className='start-command'>
            <code>
              $start 10 https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
            </code>
          </div>
        </Container>
      </section>

      <section id='guessing' className='debug'>
        <Container className='feature'>
          <Image src={GuessingExample} className='guessing-example' width='40%' />
          <div style={{ width: '40%' }}>
            <h2 className='feature-title'>Guess by typing into your channel</h2>
            <p className='feature-caption'>
              You get one point for the song name and every listed artist.
            </p>
          </div>
        </Container>
        <div>
        </div>
      </section>

      <section id='customisations' className='debug'>
        <Container>
          <h2 className='feature-title'>Customisations</h2>

          <div className='customisations debug'>
            <div className='customisation debug' id='round_duration'>
              <i className="bi bi-stopwatch" style={{ fontSize: '5rem' }} />
              <caption className='feature-caption'>Turn up the pressure with faster rounds</caption>
            </div>

            <div className='customisation debug' id='emote_nearly_correct_guesses'>
              <i className="bi bi-spellcheck" style={{ fontSize: '5rem' }} />
              <caption className='feature-caption'>Have the bot react to guesses that are a few characters off</caption>
            </div>

            <div className='customisation debug' id='prefix'>
              <i className="bi bi-code" style={{ fontSize: '5rem' }} />
              <caption className='feature-caption'>Set command prefix for your server</caption>
            </div>
          </div>

        </Container>
      </section>

      <footer>
        <Container>
          <h2>Ready to start guessing?</h2>
          <InviteButton />
        </Container>
      </footer>
    </>
  );
};

export default App;

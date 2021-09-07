import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import InviteButton from './components/invite-button';
import TopGGButton from './components/top-gg-button';

import Bird from './assets/bird.svg';

const App = () => {
  return (
    <>
      <header>
        <Container style={{ border: '0px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexWrap: 'wrap-reverse' }}
          >
            <div style={{ textAlign: 'right', border: '0px solid red' }}>
              <h1>
                <div className='gradientText'>Guess the Song</div>
                <div>discord bot</div>
              </h1>
            </div>
            <div style={{ width: '50%', border: '0px solid red' }}>
              <Image src={Bird} fluid style={{ margin: '2rem' }} />
            </div>
          </div>

          <div style={{ marginTop: '10rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div>
              <InviteButton />
              <TopGGButton />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <i className="bi bi-arrow-down" style={{ fontSize: '5rem' }} />
          </div>
        </Container>
      </header>

      <section id='how-to-start-with-spotify'>
        <Container>
          <h2>Extracts songs from Spotify playlists and shuffles them into a game</h2>
          <code>$start 10 link</code>
        </Container>
      </section>

      <section id='guess-by-typing-in-a-text-channel'>
        <Container>
          <h2>Easy guessing by typing into your text channel</h2>
          <div style={{ backgroundColor: 'red', width: '600px', height: '200px' }} />
        </Container>
      </section>

      <section id='shuffle-multiple-playlists-into-one-game'>
        <Container>
          <h2>Can combine multiple Spotify playlists together</h2>
          <div style={{ backgroundColor: 'green', width: '600px', height: '200px' }} />
        </Container>
      </section>

      <section id='customisable-configurations'>
        <Container>
          <h2>Customisations</h2>
          <div style={{ display: 'inline-block', backgroundColor: 'blue',
            margin: '10px', width: '100px', height: '100px' }}
          />
          <div style={{ display: 'inline-block', backgroundColor: 'blue',
            margin: '10px', width: '100px', height: '100px' }}
          />
          <div style={{ display: 'inline-block', backgroundColor: 'blue',
            margin: '10px', width: '100px', height: '100px' }}
          />
          <div style={{ display: 'inline-block', backgroundColor: 'blue',
            margin: '10px', width: '100px', height: '100px' }}
          />
        </Container>
      </section>

      <section id='ready-to-start-playing'>
        <Container>
          <h2>Ready to start playing?</h2>
          <InviteButton />
        </Container>
      </section>

      <footer id='contact'>
        <Container>
          <span>Contact me</span>
        </Container>
      </footer>
    </>
  );
};

export default App;

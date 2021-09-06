import React from 'react';
import './App.css';

function App() {
  return (
    <>
      <header>
        <h1>Guess the Song</h1>
        <h2>Discord Bot</h2>

        <button>Invite to your server</button>
        <button>TOP.GG</button>
      </header>
      <section id='how-to-start-with-spotify'>
        <h2>Extracts songs from Spotify playlists and shuffles them into a game</h2>
        <code>$start 10 link</code>
      </section>
      <section id='guess-by-typing-in-a-text-channel'>
        <h2>Easy guessing by typing into your text channel</h2>
        <div style={{ backgroundColor: 'red', width: '600px', height: '200px'}} />
      </section>
      <section id='shuffle-multiple-playlists-into-one-game'>
        <h2>Can combine multiple Spotify playlists together</h2>
        <div style={{ backgroundColor: 'green', width: '600px', height: '200px'}} />
      </section>
      <section id='customisable-configurations'>
        <h2>Customisations</h2>
        <div style={{ display: 'inline-block', backgroundColor: 'blue', margin: '10px', width: '100px', height: '100px'}} />
        <div style={{ display: 'inline-block', backgroundColor: 'blue', margin: '10px', width: '100px', height: '100px'}} />
        <div style={{ display: 'inline-block', backgroundColor: 'blue', margin: '10px', width: '100px', height: '100px'}} />
        <div style={{ display: 'inline-block', backgroundColor: 'blue', margin: '10px', width: '100px', height: '100px'}} />
      </section>
      <section id='ready-to-start-playing'>
        <h2>Ready to start playing?</h2>
        <button>Invite to your server</button>
      </section>
      <section id='contact'>
        <span>Contact me</span>
      </section>
    </>
  );
}

export default App;

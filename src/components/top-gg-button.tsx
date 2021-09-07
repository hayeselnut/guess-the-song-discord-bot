import React from 'react';
import { Button } from 'react-bootstrap';


const TopGGButton = () => {
  return (
    <>
      <Button
        style={{
          margin: '0.5rem',
        }}
        size='lg'
        href='https://top.gg/bot/868458391247405067'
        target='_blank'
        variant='light'
      >
        Top.gg page
      </Button>
    </>
  );
};

export default TopGGButton;

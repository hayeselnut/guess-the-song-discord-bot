import React from 'react';
import { Button } from 'react-bootstrap';

const TopGGButton = () => {
  return (
    <>
      <Button
        style={{
          margin: '1rem',
        }}
        size='lg'
        href='https://top.gg/bot/868458391247405067'
        target='_blank'
        variant='outline-dark'
      >
        Top.gg page
      </Button>
    </>
  );
};

export default TopGGButton;

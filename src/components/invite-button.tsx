import React from 'react';
import { Button } from 'react-bootstrap';

const InviteButton = () => {
  return (
    <>
      <Button
        style={{
          margin: '1rem',
        }}
        size='lg'
        href='https://discord.com/oauth2/authorize?client_id=868458391247405067&permissions=103082362880&scope=bot'
        target='_blank'
        variant='dark'
      >
        Invite to server
      </Button>
    </>
  );
};

export default InviteButton;

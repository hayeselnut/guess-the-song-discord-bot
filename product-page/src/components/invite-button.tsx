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
        // CSESoc Version for Personal Projects Competition
        href='https://discord.com/api/oauth2/authorize?client_id=886149942794653707&permissions=3147776&scope=bot'
        // Original - but currently awaiting verification
        // href='https://discord.com/oauth2/authorize?client_id=868458391247405067&permissions=103082362880&scope=bot'
        target='_blank'
        variant='dark'
      >
        Invite to server (CSESoc Version)
      </Button>
    </>
  );
};

export default InviteButton;

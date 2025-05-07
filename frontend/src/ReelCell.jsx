import React from 'react';

const SYMBOL_HEIGHT = 50;

function ReelCell({ id, getSymbolEmoji }) {
  return (
    <div style={{
      fontSize: 40,
      width: 50,
      height: SYMBOL_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 2,
      background: '#222',
      borderRadius: 8
    }}>
      {getSymbolEmoji(id)}
    </div>
  );
}

export default ReelCell; 
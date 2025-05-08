import React from 'react';
import Reel from './Reel';

function SlotMachine({ reels, getSymbolEmoji, matchedPositions = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 8, margin: '30px 0' }}>
      {reels.map((symbols, idx) => (
        <Reel
          key={idx}
          symbols={symbols}
          getSymbolEmoji={getSymbolEmoji}
          matched={matchedPositions[idx] || []}
        />
      ))}
    </div>
  );
}

export default SlotMachine; 
import React from 'react';

function ReelCell({ id, getSymbolEmoji, matched, cellSize, imgSize, emojiSize }) {
  return (
    <div
      className={`slot-cell${matched ? ' matched' : ''}`}
      style={{
        width: cellSize,
        height: cellSize,
        margin: Math.max(2, cellSize * 0.02),
        padding: Math.max(2, cellSize * 0.02),
        borderRadius: Math.max(8, cellSize * 0.08),
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {getSymbolEmoji(id, imgSize, emojiSize)}
    </div>
  );
}

export default ReelCell; 
import React, { memo } from 'react';
import './ReelCell.css';

const ReelCell = memo(({ id, getSymbolEmoji, matched, cellSize, imgSize, emojiSize }) => {
  return (
    <div
      className={`slot-cell${matched ? ' matched' : ''}`}
      style={{
        width: cellSize,
        height: cellSize,
        margin: Math.max(2, cellSize * 0.02),
        padding: Math.max(2, cellSize * 0.02)
      }}
    >
      <div className="symbol-wrapper">
      {getSymbolEmoji(id, imgSize, emojiSize)}
      </div>
    </div>
  );
});

ReelCell.displayName = 'ReelCell';

export default ReelCell; 
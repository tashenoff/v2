import React from 'react';
import { CELL_SIZE } from './constants';

function ReelCell({ id, getSymbolEmoji, matched }) {
  return (
    <div
      className={matched ? 'matched' : ''}
      style={{
        fontSize: CELL_SIZE * 0.75,
        width: CELL_SIZE,
        height: CELL_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
        background: '#222',
        borderRadius: 12
      }}
    >
      {getSymbolEmoji(id, CELL_SIZE)}
    </div>
  );
}

export default ReelCell; 
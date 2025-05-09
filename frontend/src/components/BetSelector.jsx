import React from 'react';

function BetSelector({ bet, onBetChange, disabled }) {
  const options = [10000, 50000, 100000];
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ marginRight: 8 }}>Ставка:</span>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onBetChange(opt)}
          disabled={disabled || bet === opt}
          style={{
            fontSize: 16,
            padding: '4px 16px',
            marginRight: 8,
            borderRadius: 4,
            border: bet === opt ? '2px solid #1e90ff' : '1px solid #aaa',
            background: bet === opt ? '#1e90ff' : '#fff',
            color: bet === opt ? '#fff' : '#222',
            fontWeight: bet === opt ? 'bold' : 'normal',
            cursor: bet === opt ? 'default' : 'pointer'
          }}
        >
          {opt.toLocaleString('ru-RU')}
        </button>
      ))}
    </div>
  );
}

export default BetSelector; 
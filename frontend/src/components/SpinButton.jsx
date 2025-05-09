import React from 'react';

function SpinButton({ onClick, disabled, loading, usedFreespin, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 20,
        padding: '10px 30px',
        opacity: disabled ? 0.5 : 1,
        background: usedFreespin ? '#1e90ff' : '#111',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        transition: 'background 0.2s'
      }}
      className={className}
    >
      {loading ? 'Крутим...' : 'Spin'}
    </button>
  );
}

export default SpinButton; 
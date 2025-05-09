import React from 'react';
import SpinButton from './SpinButton';

function GameControls({ 
  onSpin, 
  onAutoSpin, 
  onRestart, 
  onActivateFreespins,
  disableSpin, 
  loading, 
  usedFreespin, 
  autoSpin, 
  noChips,
  freespins
}) {
  console.log('GameControls render:', { freespins, onActivateFreespins });
  
  return (
    <div>
      <div className="controls-row">
        <SpinButton
          onClick={onSpin}
          disabled={disableSpin}
          loading={loading}
          usedFreespin={usedFreespin}
          className="spin-btn"
        />
        <button
          className={autoSpin ? 'autospin selected' : 'autospin'}
          onClick={onAutoSpin}
          disabled={loading || noChips}
        >
          Автоспин
        </button>
      </div>

      {freespins > 0 && (
        <button
          onClick={onActivateFreespins}
          className="activate-freespins"
          style={{ marginTop: 10 }}
        >
          Активировать фриспины ({freespins})
        </button>
      )}
      
      {noChips && (
        <button
          onClick={onRestart}
          style={{ marginTop: 20, fontSize: 18, padding: '8px 24px' }}
        >
          Начать заново
        </button>
      )}
    </div>
  );
}

export default GameControls; 
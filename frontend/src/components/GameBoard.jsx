import React, { useState, useEffect } from 'react';
import PixiSlotMachine from '../PixiSlotMachine';
import Jackpot from '../Jackpot';
import TopBalance from './TopBalance';
import TopBet from './TopBet';
import Modal from './Modal';
import WinInfo from './WinInfo';
import FreespinsDisplay from './FreespinsDisplay';
import BetSelector from './BetSelector';
import UserStats from './UserStats';

const GameBoard = ({
  symbols,
  result,
  cellSize,
  matchedPositions,
  balance,
  freespins,
  bet,
  loading,
  disableSpin,
  autoSpin,
  onSpin,
  onSpinComplete,
  onBetChange,
  onAutoSpinToggle
}) => {
  const [showWinModal, setShowWinModal] = useState(false);
  const [comboName, setComboName] = useState(null);
  const [payout, setPayout] = useState(0);
  const [winLevel, setWinLevel] = useState('normal');
  
  useEffect(() => {
    console.log('GameBoard - symbols updated:', symbols?.length);
    console.log('GameBoard - cell size:', cellSize);
    console.log('GameBoard - result:', result);
    
    if (!symbols || symbols.length === 0) {
      console.warn('GameBoard - No symbols available. Check API connection.');
    }
  }, [symbols, result, cellSize]);
  
  const handleSpinComplete = (data) => {
    console.log('GameBoard - spin complete data:', data);
    const spinResults = onSpinComplete ? onSpinComplete() : null;
    console.log('GameBoard - spin results from SpinLogic:', spinResults);
    
    if (spinResults) {
      if (spinResults.payout) {
        setPayout(spinResults.payout);
      }
      if (spinResults.comboName) {
        setComboName(spinResults.comboName);
      }
      if (spinResults.winLevel) {
        setWinLevel(spinResults.winLevel);
      }
      if (spinResults.payout > 0 || spinResults.jackpot_win) {
        setShowWinModal(true);
      }
    }
  };
  
  return (
    <div className="app-card">
      <div className="top-stats">
        <TopBalance balance={balance} />
        <TopBet bet={bet} />
      </div>
      
      <Jackpot />
      
      {symbols && symbols.length > 0 ? (
        <PixiSlotMachine 
          symbols={symbols}
          result={result}
          cellSize={cellSize}
          matchedPositions={matchedPositions}
          onSpinComplete={handleSpinComplete}
        />
      ) : (
        <div style={{ 
          width: cellSize * 5, 
          height: cellSize * 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#2a2a2a',
          margin: '0 auto',
          borderRadius: '10px',
          color: 'white'
        }}>
          Загрузка символов...
        </div>
      )}
      
      <Modal 
        isOpen={showWinModal} 
        onClose={() => setShowWinModal(false)}
      >
        <WinInfo 
          comboName={comboName}
          payout={payout}
          winLevel={winLevel}
        />
      </Modal>
      
      <div className="controls-container">
        <div className="controls-left">
          <button
            className="spin-btn"
            onClick={onSpin}
            disabled={disableSpin || !symbols || symbols.length === 0}
          >
            {loading ? 'Вращение...' : 'Крутить'}
          </button>
          <button
            className={`autospin ${autoSpin ? 'selected' : ''}`}
            onClick={onAutoSpinToggle}
            disabled={disableSpin || !symbols || symbols.length === 0}
          >
            {autoSpin ? 'Стоп' : 'Авто'}
          </button>
        </div>
        <div className="controls-right">
          <BetSelector 
            bet={bet} 
            onBetChange={onBetChange}
            disabled={balance <= 0 && freespins === 0}
          />
        </div>
      </div>
      
      <FreespinsDisplay count={freespins} />
      
      <UserStats />
    </div>
  );
};

export default GameBoard; 
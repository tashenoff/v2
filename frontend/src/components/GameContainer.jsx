import React, { useState, useEffect } from 'react';
import { CELL_SIZE_DESKTOP, CELL_SIZE_MOBILE } from '../constants';
import GameBoard from './GameBoard';
import SpinLogic from './SpinLogic';
import { useGameState } from '../hooks/useGameState';
import Layout from '../Layout';
import { getSymbols, getBalance, getCombinations } from '../services/apiService';

const GameContainer = ({ currentUser, setIsLoggedIn, setCurrentUser }) => {
  const {
    balance,
    freespins,
    symbols,
    bet,
    noChips,
    error,
    updateBet,
    setError,
    setSymbols,
    setBalance,
    setFreespins,
    setAutoUpdateEnabled,
    fetchState
  } = useGameState();
  
  // Определяем размер ячейки в зависимости от ширины экрана
  const [cellSize, setCellSize] = useState(() => {
    const isMobile = window.innerWidth <= 600;
    return isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
  });
  
  // Явно загружаем символы, если они не загрузились через хук
  useEffect(() => {
    console.log('GameContainer mounted, symbols:', symbols);
    if (!symbols || symbols.length === 0) {
      console.log('No symbols found in useGameState, loading manually...');
      const loadSymbols = async () => {
        try {
          const symbolsData = await getSymbols();
          console.log('Manually loaded symbols:', symbolsData.length);
          setSymbols(symbolsData);
        } catch (error) {
          console.error('Error loading symbols manually:', error);
        }
      };
      loadSymbols();
    }
  }, []);
  
  // Обновляем размер ячейки при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 600;
      setCellSize(isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  console.log('GameContainer render - symbols:', symbols?.length, 'balance:', balance, 'freespins:', freespins);
  
  return (
    <Layout
      currentUser={currentUser}
      setIsLoggedIn={setIsLoggedIn}
      setCurrentUser={setCurrentUser}
    >
      <SpinLogic
        bet={bet}
        balance={balance}
        freespins={freespins}
        setBalance={setBalance}
        setFreespins={setFreespins}
        setAutoUpdateEnabled={setAutoUpdateEnabled}
      >
        {({ 
          result, 
          loading, 
          autoSpin, 
          disableSpin, 
          matchedPositions,
          handleSpin, 
          handleSpinComplete, 
          toggleAutoSpin 
        }) => (
          <GameBoard
            symbols={symbols}
            result={result}
            cellSize={cellSize}
            matchedPositions={matchedPositions}
            balance={balance}
            freespins={freespins}
            bet={bet}
            loading={loading}
            disableSpin={disableSpin}
            autoSpin={autoSpin}
            onSpin={handleSpin}
            onSpinComplete={() => {
              // Вызываем handleSpinComplete из SpinLogic и передаем результат в GameBoard
              const spinResult = handleSpinComplete();
              return spinResult;
            }}
            onBetChange={updateBet}
            onAutoSpinToggle={toggleAutoSpin}
          />
        )}
      </SpinLogic>
    </Layout>
  );
};

export default GameContainer; 
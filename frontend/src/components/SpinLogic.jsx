import { useState, useRef, useEffect } from 'react';
import { spin } from '../services/apiService';
import { useAudio } from '../hooks/useAudio';

const SpinLogic = ({ 
  bet, 
  balance, 
  freespins, 
  setBalance, 
  setFreespins, 
  setAutoUpdateEnabled,
  children 
}) => {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [matchedPositions, setMatchedPositions] = useState([[], [], [], [], []]);
  const [jackpotWin, setJackpotWin] = useState(false);
  const [spinData, setSpinData] = useState(null);
  
  const { playSpinLoop, stopSpinLoop, playSpinClick } = useAudio();
  
  // Автоспин
  useEffect(() => {
    if (autoSpin && !loading && balance >= bet) {
      const timer = setTimeout(() => {
        handleSpin();
      }, 1200); // задержка между автоспинами
      return () => clearTimeout(timer);
    }
  }, [autoSpin, loading, balance, bet]);
  
  const handleSpin = async () => {
    try {
      setLoading(true);
      
      // Отключаем автоматическое обновление баланса во время вращения
      setAutoUpdateEnabled(false);
      
      const data = await spin(bet);
      
      playSpinClick();
      playSpinLoop();
      
      setResult(data.result);
      
      // Сохраняем данные для использования после завершения анимации
      const spinResult = {
        balance: data.balance,
        payout: data.payout,
        comboName: data.combo_name,
        matchedPositions: data.matched_positions,
        jackpot_win: data.jackpot_win,
        currentFreespins: freespins,
        newFreespins: data.freespins,
        winLevel: data.win_level || 'normal'
      };
      
      setSpinData(spinResult);
      
    } catch (error) {
      console.error('Ошибка при вращении:', error);
      setLoading(false);
      stopSpinLoop();
      // В случае ошибки включаем автоматическое обновление баланса
      setAutoUpdateEnabled(true);
    }
  };
  
  const handleSpinComplete = () => {
    console.log('SpinLogic - handleSpinComplete вызван');
    stopSpinLoop();
    setLoading(false);
    
    if (spinData) {
      // Используем данные, полученные ранее в handleSpin
      setBalance(spinData.balance);
      setFreespins(spinData.newFreespins);
      
      if (spinData.matchedPositions) {
        setMatchedPositions(spinData.matchedPositions);
      }
      
      if (spinData.jackpot_win) {
        setJackpotWin(true);
      }
      
      const resultData = { ...spinData };
      console.log('SpinLogic - возвращаем данные о выигрыше:', resultData);
      setSpinData(null);
      
      // Включаем автоматическое обновление баланса после завершения анимации
      setAutoUpdateEnabled(true);
      
      return resultData;
    }
    
    console.log('SpinLogic - нет данных о выигрыше (spinData отсутствует)');
    setAutoUpdateEnabled(true);
    return null;
  };
  
  const toggleAutoSpin = () => {
    setAutoSpin(prev => !prev);
  };
  
  // Проверка, можно ли вращать
  const disableSpin = loading || (balance < bet && freespins === 0);
  
  return children({
    result,
    loading,
    autoSpin,
    disableSpin,
    matchedPositions,
    jackpotWin,
    handleSpin,
    handleSpinComplete,
    toggleAutoSpin
  });
};

export default SpinLogic; 
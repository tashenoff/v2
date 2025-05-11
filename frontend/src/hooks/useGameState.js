import { useState, useEffect } from 'react';
import { getBalance, getSymbols, fetchBet as apiFetchBet, updateBet as apiUpdateBet } from '../services/apiService';

export function useGameState() {
  console.log('useGameState hook initialized');

  const [balance, setBalance] = useState(0);
  const [freespins, setFreespins] = useState(0);
  const [symbols, setSymbols] = useState([]);
  const [bet, setBetState] = useState(10000);
  const [noChips, setNoChips] = useState(false);
  const [error, setError] = useState('');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  // Добавляем эффект для автоматического обновления баланса
  useEffect(() => {
    if (!autoUpdateEnabled) return;
    
    const updateInterval = setInterval(fetchState, 2000); // Обновляем каждые 2 секунды
    return () => clearInterval(updateInterval);
  }, [autoUpdateEnabled]);

  const fetchState = async () => {
    console.log('Fetching game state...');
    try {
      const data = await getBalance();
      console.log('Game state received:', data);
      setBalance(data.balance);
      setFreespins(data.freespins);
      setNoChips(data.balance <= 0 && data.freespins === 0);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const fetchBet = async () => {
    console.log('Fetching bet...');
    try {
    const res = await apiFetchBet();
      console.log('Bet received:', res);
      return res;
    } catch (error) {
      console.error('Error fetching bet:', error);
    }
  };

  const updateBet = async (newBet) => {
    console.log('Updating bet:', newBet);
    try {
    setBetState(newBet);
    await apiUpdateBet(newBet);
    } catch (error) {
      console.error('Error updating bet:', error);
    }
  };

  const handleRestart = async () => {
    console.log('Restarting game...');
    try {
      const res = await fetch('http://localhost:5000/api/restart', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      console.log('Game restarted:', data);
      setBalance(data.balance);
      setFreespins(data.freespins);
      setError('');
      setNoChips(false);
    } catch (e) {
      console.error('Error restarting game:', e);
      setError('Ошибка сброса баланса');
    }
  };

  const handleActivateFreespins = async () => {
    console.log('Activating freespins...');
    try {
      await fetch('http://localhost:5000/api/activate_freespins', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await fetchState();
    } catch (e) {
      console.error('Error activating freespins:', e);
      setError('Ошибка активации фриспинов');
    }
  };

  // Инициализация
  useEffect(() => {
    console.log('useGameState initialization effect started');
    Promise.all([
      fetchState(),
      getSymbols().then(symbols => {
        console.log('Symbols loaded:', symbols.length);
        setSymbols(symbols);
      }),
      fetchBet().then(data => {
        console.log('Initial bet loaded:', data.bet);
        setBetState(data.bet);
      })
    ]).catch(error => {
      console.error('Error in initialization effect:', error);
    });
  }, []);

  return {
    balance,
    freespins,
    symbols,
    bet,
    noChips,
    error,
    fetchState,
    updateBet,
    handleRestart,
    handleActivateFreespins,
    setError,
    setSymbols,
    setBalance,
    setFreespins,
    setAutoUpdateEnabled
  };
} 
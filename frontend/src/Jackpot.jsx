import { useEffect, useState } from 'react';
import { getJackpot } from './services/apiService';

function Jackpot({ jackpotWin }) {
  const [jackpot, setJackpot] = useState(0);
  const [flash, setFlash] = useState(false);

  const fetchJackpot = async () => {
    try {
      const amount = await getJackpot();
      setJackpot(amount);
    } catch (e) {
      console.error('Error fetching jackpot:', e);
      setJackpot(0);
    }
  };

  useEffect(() => {
    fetchJackpot();
    const interval = setInterval(fetchJackpot, 2000); // обновлять каждые 2 секунды
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (jackpotWin) {
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
    }
  }, [jackpotWin]);

  return (
    <div style={{
      background: flash ? '#ffd700' : '#222',
      color: flash ? '#222' : '#ffd700',
      fontWeight: 'bold',
      fontSize: 28,
      padding: '10px 0',
      borderRadius: 10,
      marginBottom: 18,
      boxShadow: '0 2px 8px #0003',
      letterSpacing: 2,
      transition: 'all 0.4s'
    }}>
      Джекпот: {new Intl.NumberFormat('ru-RU', { 
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(jackpot)} ₽
    </div>
  );
}

export default Jackpot; 
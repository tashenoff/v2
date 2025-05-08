import { useEffect, useState } from 'react';

function Jackpot({ jackpotWin }) {
  const [jackpot, setJackpot] = useState(0);
  const [flash, setFlash] = useState(false);

  const fetchJackpot = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/jackpot');
      const data = await res.json();
      setJackpot(data.jackpot);
    } catch (e) {
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
      Джекпот: {jackpot}
    </div>
  );
}

export default Jackpot; 
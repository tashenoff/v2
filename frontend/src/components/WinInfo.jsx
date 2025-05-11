import React, { useEffect, useState } from 'react';
import AnimatedNumber from './AnimatedNumber';
import './AnimatedNumber.css';

function WinInfo({ comboName, payout }) {
  const [startAnimation, setStartAnimation] = useState(false);
  
  useEffect(() => {
    // Запускаем анимацию с небольшой задержкой для лучшего визуального эффекта
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!comboName && payout <= 0) return null;
  
  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('ru-RU').format(num) : '0';
  };
  
  return (
    <div className="win-info">
      {comboName && (
        <div className="combo-name">
          Комбинация: {comboName}
        </div>
      )}
      {payout > 0 && (
        <div className="payout-amount">
          Выигрыш: <span className="win-value">{startAnimation ? (
            <AnimatedNumber 
              value={payout} 
              formatValue={formatNumber}
              duration={1500} 
              className="win-animation"
            />
          ) : (
            '0'
          )}</span>
        </div>
      )}
    </div>
  );
}

export default WinInfo; 
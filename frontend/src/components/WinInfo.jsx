import React, { useEffect, useState } from 'react';
import AnimatedNumber from './AnimatedNumber';
import './WinInfo.css';

const WIN_LEVEL_STYLES = {
  normal: {
    color: '#4CAF50',
    text: 'Обычный выигрыш'
  },
  medium: {
    color: '#2196F3',
    text: 'Средний выигрыш'
  },
  big: {
    color: '#FF9800',
    text: 'Большой выигрыш'
  },
  mega: {
    color: '#E91E63',
    text: 'Мега выигрыш'
  },
  super: {
    color: '#FFD700',
    text: 'Супер выигрыш'
  }
};

function WinInfo({ comboName, payout, winLevel = 'normal' }) {
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

  const levelStyle = WIN_LEVEL_STYLES[winLevel] || WIN_LEVEL_STYLES.normal;
  
  return (
    <div className="win-info">
      {comboName && (
        <div className="combo-name">
          Комбинация: {comboName}
        </div>
      )}
      {payout > 0 && (
        <>
          <div className="win-level" style={{ color: levelStyle.color }}>
            {levelStyle.text}
          </div>
          <div className="payout-amount" style={{ color: levelStyle.color }}>
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
        </>
      )}
    </div>
  );
}

export default WinInfo; 
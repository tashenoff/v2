import React from 'react';
import AnimatedNumber from './AnimatedNumber';

const TopBalance = ({ balance }) => {
  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('ru-RU').format(num) : '0';
  };

  return (
    <div className="top-balance">
      <div className="label">Баланс</div>
      <div className="value">
        <AnimatedNumber 
          value={balance} 
          formatValue={formatNumber} 
          duration={800} 
        /> ₽
      </div>
    </div>
  );
};

export default TopBalance; 
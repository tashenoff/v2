import React from 'react';

const TopBet = ({ bet }) => {
  const formatNumber = (num) => {
    return num ? num.toLocaleString('ru-RU') : '0';
  };

  return (
    <div className="top-bet">
      <div className="label">Ставка</div>
      <div className="value">{formatNumber(bet)} ₽</div>
    </div>
  );
};

export default TopBet; 
import React from 'react';

const TopBalance = ({ balance }) => {
  return (
    <div className="top-balance">
      <div className="label">Баланс</div>
      <div className="value">{balance.toLocaleString()} ₽</div>
    </div>
  );
};

export default TopBalance; 
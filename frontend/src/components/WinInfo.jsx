import React from 'react';

function WinInfo({ comboName, payout }) {
  if (!comboName && payout <= 0) return null;
  return (
    <div className="win-info">
      {comboName && (
        <div className="combo-name">
          Комбинация: {comboName}
        </div>
      )}
      {payout > 0 && (
        <div className="payout-amount">
          Выигрыш: {payout}
        </div>
      )}
    </div>
  );
}

export default WinInfo; 
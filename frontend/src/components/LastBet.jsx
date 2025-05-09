import React from 'react';

function LastBet({ lastBet }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  if (!lastBet) {
    return null;
  }

  return (
    <div className="last-bet" style={{
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      marginTop: '20px',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ffd700' }}>Текущая ставка</h3>
      <div style={{ 
        display: 'grid',
        gap: '10px'
      }}>
        <div className="bet-item">
          <div className="bet-value" style={{ color: '#1e90ff', fontSize: '1.5em', fontWeight: 'bold' }}>
            {formatNumber(lastBet.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LastBet; 
import React from 'react';

function LastWin({ lastWin }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет данных';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (!lastWin) {
    return null;
  }

  return (
    <div className="last-win" style={{
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      marginTop: '20px',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ffd700' }}>Последний выигрыш</h3>
      <div style={{ 
        display: 'grid',
        gap: '10px'
      }}>
        <div className="win-item">
          <div className="win-label">Сумма:</div>
          <div className="win-value" style={{ color: '#4CAF50', fontSize: '1.5em', fontWeight: 'bold' }}>
            {formatNumber(lastWin.amount)}
          </div>
        </div>
        <div className="win-item">
          <div className="win-label">Комбинация:</div>
          <div className="win-value" style={{ color: '#ff4081' }}>
            {lastWin.combo_name || 'Обычная выплата'}
          </div>
        </div>
        <div className="win-item">
          <div className="win-label">Время:</div>
          <div className="win-value" style={{ fontSize: '0.9em' }}>
            {formatDate(lastWin.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LastWin; 
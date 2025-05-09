import React from 'react';

function GameInfo({ balance, freespins, noChips, error, usedFreespin }) {
  return (
    <div>
      <div className="balance-row">
        Баланс: {balance.toLocaleString('ru-RU')} | Фриспины: {freespins}
      </div>
      
      {usedFreespin && (
        <div style={{ color: '#1e90ff', fontWeight: 'bold', marginBottom: 8 }}>
          Бесплатное вращение!
        </div>
      )}
      
      {noChips && (
        <div style={{ color: 'orange', marginTop: 12 }}>
          Баланс исчерпан! Пополните счёт или начните заново.
        </div>
      )}
      
      {error && !noChips && (
        <div style={{ color: 'red', marginTop: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default GameInfo; 
import React from 'react';
import AnimatedNumber from './AnimatedNumber';

const FreespinsDisplay = ({ count }) => (
  <div className="freespins-display" style={{
    textAlign: 'center',
    padding: '10px',
    color: '#ffd700',
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    margin: '10px 20px',
    display: 'block' // Всегда показываем блок
  }}>
    🎰 {count > 0 ? `Доступно фриспинов: ` : 'Нет доступных фриспинов'}
    {count > 0 && <AnimatedNumber value={count} duration={800} />}
  </div>
);

export default FreespinsDisplay; 
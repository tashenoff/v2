import React, { useState, useEffect } from 'react';
import Reel from './Reel';
import Preloader from './components/Preloader';
import './components/Preloader.css';

function SlotMachine({ reels, getSymbolEmoji, matchedPositions = [], cellSize, imgSize, emojiSize }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Если есть хотя бы один символ в барабанах, считаем что загрузка завершена
    if (reels.some(reel => reel.length > 0)) {
      const timer = setTimeout(() => setIsLoading(false), 500); // Небольшая задержка для плавности
      return () => clearTimeout(timer);
    }
  }, [reels]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      justifyContent: 'center', 
      gap: 8, 
      margin: '30px 0',
      position: 'relative' 
    }}>
      {isLoading && <Preloader />}
      {reels.map((symbols, idx) => (
        <Reel
          key={idx}
          symbols={symbols}
          getSymbolEmoji={getSymbolEmoji}
          matched={matchedPositions[idx] || []}
          cellSize={cellSize}
          imgSize={imgSize}
          emojiSize={emojiSize}
        />
      ))}
    </div>
  );
}

export default SlotMachine; 
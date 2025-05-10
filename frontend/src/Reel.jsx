import React, { useEffect, useRef, useState } from 'react';
import ReelCell from './ReelCell';
import './Reel.css';

function Reel({ symbols, getSymbolEmoji, matched = [], cellSize, imgSize, emojiSize }) {
  const reelRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySymbols, setDisplaySymbols] = useState(symbols);
  const [animSymbols, setAnimSymbols] = useState(symbols);

  useEffect(() => {
    if (symbols.length > 3) {
      // Добавляем дополнительные символы для создания эффекта бесконечной ленты
      const extraSymbols = [...symbols.slice(-3), ...symbols, ...symbols.slice(0, 3)];
      setAnimSymbols(extraSymbols);
      setIsAnimating(true);
      setOffset(-(3 * cellSize)); // Начинаем с позиции, где видны первые символы

      // Запускаем анимацию
      requestAnimationFrame(() => {
        setOffset(-((symbols.length + 3) * cellSize));
      });
    } else {
      setIsAnimating(false);
      setOffset(0);
      setAnimSymbols(symbols);
      setDisplaySymbols(symbols);
    }
  }, [symbols, cellSize]);

  const handleTransitionEnd = () => {
    if (isAnimating && animSymbols.length > 3) {
      setIsAnimating(false);
      setDisplaySymbols(symbols.slice(-3));
      setAnimSymbols(symbols.slice(-3));
      setOffset(0);
    }
  };

  return (
    <div className="reel-container" style={{
      width: cellSize + 10,
      height: cellSize * 3,
      overflow: 'hidden',
      borderRadius: 12,
      background: '#222',
      boxShadow: '0 2px 6px #0002',
      position: 'relative'
    }}>
      <div className="reel-blur-top" />
      <div className="reel-blur-bottom" />
      <div
        ref={reelRef}
        className={`reel-strip ${isAnimating ? 'animating' : ''}`}
        style={{
          transform: `translateY(${offset}px)`,
          transition: isAnimating ? 'transform 2s cubic-bezier(0.1, 0.7, 0.5, 1)' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {(isAnimating ? animSymbols : displaySymbols).map((id, idx) => (
          <ReelCell 
            key={`${id}-${idx}`}
            id={id} 
            getSymbolEmoji={id => getSymbolEmoji(id, imgSize, emojiSize)} 
            matched={matched.includes(idx)} 
            cellSize={cellSize} 
            imgSize={imgSize} 
            emojiSize={emojiSize}
          />
        ))}
      </div>
    </div>
  );
}

export default Reel; 
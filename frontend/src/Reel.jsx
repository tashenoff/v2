import React, { useEffect, useRef, useState } from 'react';
import ReelCell from './ReelCell';

const SYMBOL_HEIGHT = 50;

function Reel({ symbols, getSymbolEmoji }) {
  const reelRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySymbols, setDisplaySymbols] = useState(symbols);

  useEffect(() => {
    if (symbols.length > 3) {
      // Анимация: прокрутить к последним 3 символам
      setIsAnimating(true);
      setOffset(-((symbols.length - 3) * SYMBOL_HEIGHT));
      setDisplaySymbols(symbols);
    } else {
      // Нет анимации, просто показываем
      setIsAnimating(false);
      setOffset(0);
      setDisplaySymbols(symbols);
    }
  }, [symbols]);

  const handleTransitionEnd = () => {
    if (isAnimating && displaySymbols.length > 3) {
      setIsAnimating(false);
      // Оставляем только последние 3 символа
      setDisplaySymbols(displaySymbols.slice(-3));
      setOffset(0);
    }
  };

  return (
    <div style={{
      width: 60,
      height: SYMBOL_HEIGHT * 3,
      overflow: 'hidden',
      borderRadius: 8,
      background: '#222',
      boxShadow: '0 2px 6px #0002',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      <div
        ref={reelRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(${offset}px)`,
          transition: isAnimating ? 'transform 1s cubic-bezier(.17,.67,.83,.67)' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {displaySymbols.map((id, idx) => (
          <ReelCell key={idx} id={id} getSymbolEmoji={getSymbolEmoji} />
        ))}
      </div>
    </div>
  );
}

export default Reel; 
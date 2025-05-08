import React, { useEffect, useRef, useState } from 'react';
import ReelCell from './ReelCell';
import { CELL_SIZE } from './constants';

function Reel({ symbols, getSymbolEmoji, matched = [] }) {
  const reelRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySymbols, setDisplaySymbols] = useState(symbols);
  const [animSymbols, setAnimSymbols] = useState(symbols);

  useEffect(() => {
    // Если symbols.length > 3 — это запуск анимации
    if (symbols.length > 3) {
      // Формируем длинный массив: случайные + финальные 3
      setAnimSymbols(symbols);
      setIsAnimating(true);
      setOffset(0);
      // Запускаем анимацию через небольшой таймаут (чтобы transition сработал)
      setTimeout(() => {
        setOffset(-((symbols.length - 3) * CELL_SIZE));
      }, 30);
    } else {
      // Нет анимации, просто показываем
      setIsAnimating(false);
      setOffset(0);
      setAnimSymbols(symbols);
      setDisplaySymbols(symbols);
    }
  }, [symbols]);

  const handleTransitionEnd = () => {
    if (isAnimating && animSymbols.length > 3) {
      setIsAnimating(false);
      // Оставляем только последние 3 символа
      setDisplaySymbols(animSymbols.slice(-3));
      setAnimSymbols(animSymbols.slice(-3));
      setOffset(0);
    }
  };

  return (
    <div style={{
      width: CELL_SIZE + 10,
      height: CELL_SIZE * 3,
      overflow: 'hidden',
      borderRadius: 12,
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
        {(isAnimating ? animSymbols : displaySymbols).map((id, idx) => (
          <ReelCell key={idx} id={id} getSymbolEmoji={(id) => getSymbolEmoji(id, CELL_SIZE)} matched={matched.includes(idx)} />
        ))}
      </div>
    </div>
  );
}

export default Reel; 
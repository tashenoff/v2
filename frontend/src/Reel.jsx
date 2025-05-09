import React, { useEffect, useRef, useState } from 'react';
import ReelCell from './ReelCell';

function Reel({ symbols, getSymbolEmoji, matched = [], cellSize, imgSize, emojiSize }) {
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
        setOffset(-((symbols.length - 3) * cellSize));
      }, 30);
    } else {
      // Нет анимации, просто показываем
      setIsAnimating(false);
      setOffset(0);
      setAnimSymbols(symbols);
      setDisplaySymbols(symbols);
    }
  }, [symbols, cellSize]);

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
      width: cellSize + 10,
      height: cellSize * 3,
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
          <ReelCell key={idx} id={id} getSymbolEmoji={id => getSymbolEmoji(id, imgSize, emojiSize)} matched={matched.includes(idx)} cellSize={cellSize} imgSize={imgSize} emojiSize={emojiSize} />
        ))}
      </div>
    </div>
  );
}

export default Reel; 
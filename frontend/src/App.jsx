import { useEffect, useState, useRef } from 'react';
import { getBalance, getSymbols, spin } from './api';
import SlotMachine from './SlotMachine';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const REELS_COUNT = 5;
const SYMBOLS_ON_REEL = 20;
const SYMBOLS_VISIBLE = 3;
const ANIMATION_LENGTH = 20;
const SPIN_START_DELAY = 180; // задержка между стартом вращения барабанов (мс)
const SPIN_STOP_DELAY = 600; // задержка между остановкой барабанов (мс)

function getRandomSymbols(symbols, count) {
  return Array.from({ length: count }, () => symbols[Math.floor(Math.random() * symbols.length)].id);
}

// Компонент для отображения информации о выигрыше
function WinInfo({ comboName, payout }) {
  if (!comboName && payout <= 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      {comboName && (
        <div style={{ color: '#1e90ff', fontSize: 18, marginBottom: 4 }}>
          Комбинация: {comboName}
        </div>
      )}
      {payout > 0 && (
        <div style={{ color: 'green', fontSize: 24 }}>
          Выигрыш: {payout}
        </div>
      )}
    </div>
  );
}

// Компонент кнопки Spin
function SpinButton({ onClick, disabled, loading, usedFreespin }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 20,
        padding: '10px 30px',
        opacity: disabled ? 0.5 : 1,
        background: usedFreespin ? '#1e90ff' : '#111',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        transition: 'background 0.2s',
        marginTop: 24
      }}
    >
      {loading ? 'Крутим...' : 'Spin'}
    </button>
  );
}

function App() {
  const [balance, setBalance] = useState(0);
  const [freespins, setFreespins] = useState(0);
  const [symbols, setSymbols] = useState([]);
  const [result, setResult] = useState([]);
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noChips, setNoChips] = useState(false);
  const [usedFreespin, setUsedFreespin] = useState(false);
  const [comboName, setComboName] = useState(null);
  const [reelsState, setReelsState] = useState([]);
  const animationIntervals = useRef([]);
  const [spinning, setSpinning] = useState(false);
  const [stopSymbols, setStopSymbols] = useState(null);
  const [initialReels, setInitialReels] = useState([]);
  const [reelsForSpin, setReelsForSpin] = useState([]);

  useEffect(() => {
    fetchState();
    getSymbols().then(setSymbols);
  }, []);

  // Генерируем случайные символы для барабанов (до первого спина)
  useEffect(() => {
    if (symbols.length) {
      const reels = [];
      for (let i = 0; i < REELS_COUNT; i++) {
        reels.push({ symbols: getRandomSymbols(symbols, SYMBOLS_VISIBLE), animating: false });
      }
      setReelsState(reels);
    }
  }, [symbols]);

  const fetchState = async () => {
    const data = await getBalance();
    setBalance(data.balance);
    setFreespins(data.freespins);
    setNoChips(data.balance <= 0 && data.freespins === 0);
  };

  const handleSpin = async () => {
    setLoading(true);
    setError('');
    setPayout(0);
    setUsedFreespin(false);
    setComboName(null);
    setResult([]);
    // ВАЖНО: Логика анимации барабанов
    // 1. Сначала получаем результат от бэка (finalReels)
    // 2. Для каждого барабана запускаем анимацию вращения через setInterval (быстрая смена символов)
    // 3. После заданного количества циклов анимации каждый барабан ОСТАНАВЛИВАЕТСЯ ровно на нужной тройке символов из ответа бэка
    // 4. После остановки барабанов символы больше не меняются!
    // 5. setResult используется только для расчёта выигрыша и comboName, но не для отображения символов
    // Не менять эту логику — иначе появятся баги с "прыжками" символов!
    // ---
    // Сразу получаем результат от бэка
    const data = await spin();
    let finalReels;
    if (data.result.length === 15) {
      finalReels = [0,1,2,3,4].map(i => data.result.slice(i*3, i*3+3));
    } else if (data.result.length === 5) {
      finalReels = [0,1,2,3,4].map(i => [
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : '',
        data.result[i],
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : ''
      ]);
    } else {
      finalReels = [0,1,2,3,4].map(() => [
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : '',
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : '',
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : ''
      ]);
    }
    // Анимация вращения барабанов с остановкой на нужных символах
    let currentReels = reelsState.length === REELS_COUNT ? [...reelsState] : Array(REELS_COUNT).fill().map(() => ({ symbols: getRandomSymbols(symbols, SYMBOLS_VISIBLE), animating: false }));
    const SPIN_CYCLES = 18; // сколько раз "прокрутить" каждый барабан
    for (let i = 0; i < REELS_COUNT; i++) {
      // Каскадный запуск с задержкой
      setTimeout(() => {
        let spins = 0;
        const interval = setInterval(() => {
          spins++;
          if (spins < SPIN_CYCLES) {
            currentReels = currentReels.map((r, idx) =>
              idx === i
                ? { symbols: getRandomSymbols(symbols, ANIMATION_LENGTH), animating: true }
                : r
            );
            setReelsState([...currentReels]);
          } else {
            clearInterval(interval);
            currentReels = currentReels.map((r, idx) =>
              idx === i
                ? { symbols: finalReels[i], animating: false }
                : r
            );
            setReelsState([...currentReels]);
          }
        }, 60);
      }, i * SPIN_START_DELAY);
    }
    // После полной остановки всех барабанов — обновляем результат и выигрыш
    setTimeout(async () => {
      setResult(data.result); // только для расчёта выигрыша и comboName
      setPayout(data.payout);
      setComboName(data.combo_name);
      await fetchState();
      if (data.freespins < freespins) setUsedFreespin(true);
      if (data.error) setError(data.error);
      setLoading(false);
    }, REELS_COUNT * SPIN_START_DELAY + SPIN_CYCLES * 60 + 400);
  };

  const handleRestart = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/restart', { method: 'POST' });
      const data = await res.json();
      setBalance(data.balance);
      setFreespins(data.freespins);
      setResult([]);
      setPayout(0);
      setError('');
      setNoChips(false);
      setUsedFreespin(false);
    } catch (e) {
      setError('Ошибка сброса баланса');
    }
  };

  const handleActivateFreespins = async () => {
    try {
      await fetch('http://localhost:5000/api/activate_freespins', { method: 'POST' });
      await fetchState();
    } catch (e) {
      setError('Ошибка активации фриспинов');
    }
  };

  const getSymbolEmoji = (id) => {
    const sym = symbols.find(s => s.id === id);
    return sym ? sym.emoji : id;
  };

  // Формируем reels для отображения/анимации
  const getReels = () => {
    if (spinning && reelsForSpin.length === REELS_COUNT) {
      return reelsForSpin;
    }
    if (stopSymbols && stopSymbols.length === REELS_COUNT) {
      return stopSymbols;
    }
    if (result.length === 15) {
      return [0,1,2,3,4].map(i => result.slice(i*3, i*3+3));
    } else if (result.length === 5) {
      return [0,1,2,3,4].map(i => [
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : '',
        result[i],
        symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : ''
      ]);
    } else if (initialReels.length === REELS_COUNT) {
      return initialReels;
    } else {
      return Array(REELS_COUNT).fill().map(() => Array(SYMBOLS_VISIBLE).fill(''));
    }
  };

  // Анимация вращения барабанов
  const startReelsAnimation = () => {
    const newReels = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) {
      animationIntervals.current[i] = setInterval(() => {
        setReelsState(prev => {
          const copy = prev.map((r, idx) =>
            idx === i
              ? { symbols: Array.from({ length: SYMBOLS_VISIBLE }, () => symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : ''), animating: true }
              : r
          );
          return copy;
        });
      }, 60 + i * 10);
    }
  };

  const stopReelsAnimation = (finalReels) => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        clearInterval(animationIntervals.current[i]);
        setReelsState(prev => {
          const copy = prev.map((r, idx) =>
            idx === i
              ? { symbols: finalReels[i], animating: false }
              : r
          );
          return copy;
        });
      }, 700 + i * 300);
    }
    // Сбросить анимацию после остановки всех барабанов
    setTimeout(() => {
      setReelsState(prev => prev.map(r => ({ ...r, animating: false })));
    }, 700 + 5 * 300 + 200);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Слот-машина</h1>
      <div style={{ marginBottom: 16 }}>
        <b>Баланс:</b> {balance} | <b>Фриспины:</b> {freespins}
      </div>
      <button
        onClick={handleActivateFreespins}
        style={{ marginBottom: 16, fontSize: 16, padding: '6px 18px', background: '#1e90ff', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        Активировать 10 фриспинов
      </button>
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
      {error && !noChips && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {/* Информация о выигрыше */}
      <WinInfo comboName={comboName} payout={payout} />
      {/* Слот-машина */}
      <SlotMachine
        reels={reelsState.map(r => r.symbols || [])}
        getSymbolEmoji={getSymbolEmoji}
      />
      {/* Кнопка Spin */}
      <SpinButton
        onClick={handleSpin}
        disabled={loading || noChips}
        loading={loading}
        usedFreespin={usedFreespin}
      />
      {noChips && (
        <button
          onClick={handleRestart}
          style={{ marginTop: 20, fontSize: 18, padding: '8px 24px' }}
        >
          Начать заново
        </button>
      )}
    </div>
  );
}

export default App;

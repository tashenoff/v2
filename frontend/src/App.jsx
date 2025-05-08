import { useEffect, useState, useRef } from 'react';
import { getBalance, getSymbols, spin } from './api';
import SlotMachine from './SlotMachine';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Jackpot from './Jackpot';

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

// Компонент выбора ставки
function BetSelector({ bet, setBet, disabled }) {
  const options = [10000, 50000, 100000];
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ marginRight: 8 }}>Ставка:</span>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => setBet(opt)}
          disabled={disabled || bet === opt}
          style={{
            fontSize: 16,
            padding: '4px 16px',
            marginRight: 8,
            borderRadius: 4,
            border: bet === opt ? '2px solid #1e90ff' : '1px solid #aaa',
            background: bet === opt ? '#1e90ff' : '#fff',
            color: bet === opt ? '#fff' : '#222',
            fontWeight: bet === opt ? 'bold' : 'normal',
            cursor: bet === opt ? 'default' : 'pointer'
          }}
        >
          {opt.toLocaleString('ru-RU')}
        </button>
      ))}
    </div>
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
  const [bet, setBetState] = useState(100);
  const [autoSpin, setAutoSpin] = useState(false);
  const [matchedPositions, setMatchedPositions] = useState([[], [], [], [], []]);
  const [jackpotWin, setJackpotWin] = useState(false);

  useEffect(() => {
    fetchState();
    getSymbols().then(setSymbols);
    fetchBet();
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

  useEffect(() => {
    if (autoSpin && !loading && !noChips && !error) {
      const timer = setTimeout(() => {
        handleSpin();
      }, 1200); // задержка между автоспинами
      return () => clearTimeout(timer);
    }
  }, [autoSpin, loading, noChips, error]);

  const fetchState = async () => {
    const data = await getBalance();
    setBalance(data.balance);
    setFreespins(data.freespins);
    setNoChips(data.balance <= 0 && data.freespins === 0);
  };

  // Получение и установка ставки через backend
  const fetchBet = async () => {
    const res = await fetch('http://localhost:5000/api/bet');
    const data = await res.json();
    setBetState(data.bet);
  };

  const updateBet = async (newBet) => {
    setBetState(newBet); // Сразу обновляем локально
    await fetch('http://localhost:5000/api/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet: newBet })
    });
  };

  const handleSpin = async () => {
    setLoading(true);
    setError('');
    setPayout(0);
    setUsedFreespin(false);
    setComboName(null);
    setResult([]);
    // Получаем результат от бэка
    const data = await fetch('http://localhost:5000/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet })
    }).then(r => r.json());

    // --- Новый блок: формируем массивы для анимации ---
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

    // Для каждого барабана формируем массив: N случайных + 3 финальных
    const ANIMATION_SYMBOLS = 15; // сколько всего символов в анимации (>=3)
    const reelsForAnimation = finalReels.map(final3 => {
      const randoms = Array.from({length: ANIMATION_SYMBOLS - 3}, () => symbols.length ? symbols[Math.floor(Math.random()*symbols.length)].id : '');
      return [...randoms, ...final3];
    });

    // Поочерёдный запуск анимации барабанов БЕЗ сброса в пустое состояние
    const START_DELAY = 200; // задержка между стартом барабанов (мс)
    reelsForAnimation.forEach((arr, i) => {
      setTimeout(() => {
        setReelsState(prev => prev.map((r, idx) =>
          idx === i ? { symbols: arr, animating: true } : r
        ));
      }, i * START_DELAY);
    });

    // Поочерёдная остановка барабанов с задержкой
    const STOP_DELAY = 250; // задержка между остановкой барабанов (мс)
    finalReels.forEach((finalArr, i) => {
      setTimeout(() => {
        setReelsState(prev => prev.map((r, idx) =>
          idx === i ? { symbols: finalArr, animating: false } : r
        ));
      }, 1000 + i * STOP_DELAY + i * START_DELAY); // учтём задержку старта
    });

    // После остановки последнего барабана — обновляем результат и выигрыш
    setTimeout(() => {
      setResult(data.result);
      setPayout(data.payout);
      setComboName(data.combo_name);
      // Определяем совпавшие позиции (как раньше)
      let matched = [[], [], [], [], []];
      if (data.result && data.combo_id) {
        if (data.result.length === 15 && data.combo_id) {
          if (data.combo_id.includes('center')) {
            for (let i = 0; i < 5; i++) matched[i] = [1];
          }
        }
        if (data.result.length === 5 && data.combo_id) {
          for (let i = 0; i < 5; i++) matched[i] = [1];
        }
      }
      setMatchedPositions(matched);
      fetchState();
      if (data.freespins < freespins) setUsedFreespin(true);
      if (data.error) setError(data.error);
      setLoading(false);
      if (data.error || data.balance <= 0) setAutoSpin(false);
      if (data.jackpot_win) {
        setJackpotWin(true);
        setTimeout(() => setJackpotWin(false), 2000);
      }
    }, 1000 + REELS_COUNT * STOP_DELAY + REELS_COUNT * START_DELAY + 200); // после остановки последнего барабана
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

  const getSymbolEmoji = (id, size = 36) => {
    const sym = symbols.find(s => s.id === id);
    if (!sym) return id;
    if (sym.image) {
      return <img src={"/assets/" + sym.image} alt={id} style={{ width: size, height: size, objectFit: 'contain' }} />;
    }
    return <span style={{ fontSize: size * 0.75 }}>{sym.emoji}</span>;
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

  // disableSpin: если баланс меньше ставки и нет фриспинов
  const disableSpin = loading || noChips || (balance < bet && freespins === 0);

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <Jackpot jackpotWin={jackpotWin} />
      <h1>Слот-машина</h1>
      <div style={{ marginBottom: 16 }}>
        <b>Баланс:</b> {balance} | <b>Фриспины:</b> {freespins}
      </div>
      {/* Выбор ставки */}
      <BetSelector bet={bet} setBet={updateBet} disabled={loading || noChips} />
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
        matchedPositions={matchedPositions}
      />
      {/* Кнопка Spin */}
      <SpinButton
        onClick={handleSpin}
        disabled={disableSpin}
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
      {/* Кнопка автоспина */}
      <button
        onClick={() => setAutoSpin(a => !a)}
        disabled={loading || noChips}
        style={{ marginBottom: 12, fontSize: 16, padding: '6px 18px', background: autoSpin ? '#1e90ff' : '#444', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        {autoSpin ? 'Стоп автоспин' : 'Автоспин'}
      </button>
    </div>
  );
}

export default App;

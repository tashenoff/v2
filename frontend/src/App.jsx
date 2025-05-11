import React, { useState, useEffect, useRef, Component } from 'react';
import { getBalance, getSymbols, spin, fetchBet as apiFetchBet, updateBet, getCombinations } from './services/apiService';
import { isAuthenticated, getCurrentUser } from './services/auth';
import SlotMachine from './SlotMachine';
import PixiSlotMachine from './PixiSlotMachine';
import './App.css'
import Jackpot from './Jackpot';
import { CELL_SIZE_DESKTOP, CELL_SIZE_MOBILE, REELS_COUNT, SYMBOLS_ON_REEL, SYMBOLS_VISIBLE, ANIMATION_LENGTH, SPIN_START_DELAY, SPIN_STOP_DELAY } from './constants';
import Layout from './Layout';
import WinInfo from './components/WinInfo';
import SpinButton from './components/SpinButton';
import BetSelector from './components/BetSelector';
import GameInfo from './components/GameInfo';
import GameControls from './components/GameControls';
import UserStats from './components/UserStats';
import TopBalance from './components/TopBalance';
import TopBet from './components/TopBet';
import { useAudio } from './hooks/useAudio';
import { useGameState } from './hooks/useGameState';
import GameCard from './components/GameCard';
import Modal from './components/Modal';
import './components/WinInfo.css';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import { logout } from './services/auth';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error details:', {
      error: error,
      componentStack: errorInfo.componentStack
    });
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#1a1a1a', margin: 20, borderRadius: 8 }}>
          <h2>Произошла ошибка при рендеринге</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 10, color: '#ff6b6b' }}>
            <summary>Показать детали ошибки</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function getRandomSymbols(symbols, count) {
  return Array.from({ length: count }, () => symbols[Math.floor(Math.random() * symbols.length)].id);
}

// Выносим компонент FreespinsDisplay за пределы App
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
    🎰 {count > 0 ? `Доступно фриспинов: ${count}` : 'Нет доступных фриспинов'}
  </div>
);

function App() {
  console.log('App component initialization started');

  const {
    balance,
    freespins,
    symbols,
    bet,
    noChips,
    error,
    fetchState,
    updateBet,
    handleRestart,
    handleActivateFreespins,
    setError,
    setSymbols,
    setBalance,
    setFreespins
  } = useGameState();

  console.log('useGameState hook initialized:', {
    balance,
    freespins,
    symbols: symbols?.length,
    bet,
    noChips,
    error
  });

  const { playSpinLoop, stopSpinLoop, playSpinClick } = useAudio();

  const [result, setResult] = useState([]);
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usedFreespin, setUsedFreespin] = useState(false);
  const [comboName, setComboName] = useState(null);
  const [reelsState, setReelsState] = useState(Array(REELS_COUNT).fill().map(() => ({ symbols: [], animating: false })));
  const animationIntervals = useRef([]);
  const [spinning, setSpinning] = useState(false);
  const [stopSymbols, setStopSymbols] = useState(null);
  const [initialReels, setInitialReels] = useState([]);
  const [reelsForSpin, setReelsForSpin] = useState([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [matchedPositions, setMatchedPositions] = useState([[], [], [], [], []]);
  const [jackpotWin, setJackpotWin] = useState(false);
  const spinLoopAudio = useRef(null);
  const [background, setBackground] = useState({ color: '#232323', image: '' });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);
  const [combinations, setCombinations] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [appError, setAppError] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [totalBets, setTotalBets] = useState(0);
  const [maxWin, setMaxWin] = useState(0);
  const [jackpotsWon, setJackpotsWon] = useState(0);
  const [lastSpin, setLastSpin] = useState(null);

  // Определяем размер ячейки в зависимости от ширины экрана
  const isMobile = window.innerWidth <= 600;
  const CELL_SIZE = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
  const imgSize = CELL_SIZE * 0.7;
  const emojiSize = CELL_SIZE * 0.6;

  useEffect(() => {
    console.log('isLoggedIn effect triggered:', isLoggedIn);
    if (isLoggedIn) {
      loadGameData();
    } else {
      setShowLogin(true); // Показываем форму логина если пользователь не авторизован
    }
  }, [isLoggedIn]);

  const loadGameData = async () => {
    console.log('Loading game data...');
    try {
      const [balanceData, symbolsData, combinationsData] = await Promise.all([
        getBalance(),
        getSymbols(),
        getCombinations()
      ]);

      console.log('Game data loaded:', {
        balanceData,
        symbolsCount: symbolsData.length,
        combinationsCount: combinationsData.length
      });

      setBalance(balanceData.balance);
      setFreespins(balanceData.freespins);
      setSymbols(symbolsData);
      setCombinations(combinationsData);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  useEffect(() => {
    console.log('Initial data loading effect started');
    setIsInitialLoading(true);
    setAppError(null);

    const loadInitialData = async () => {
      try {
        console.log('Loading initial data...');
        const [stateResult, symbolsResult] = await Promise.all([
          fetchState().catch(e => {
            console.error('Error fetching state:', e);
            throw new Error('Не удалось загрузить состояние игры');
          }),
          getSymbols().catch(e => {
            console.error('Error fetching symbols:', e);
            throw new Error('Не удалось загрузить символы');
          })
        ]);
        console.log('Initial data loaded:', { stateResult, symbolsResult });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setAppError(error.message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    console.log('Symbols effect triggered:', {
      symbolsLength: symbols.length,
      reelsState: reelsState.map(r => r.symbols.length)
    });
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

  const getBetFromApi = async () => {
    const res = await apiFetchBet();
    updateBet(res.bet);
  };

  const handleSpin = async () => {
    try {
      console.log('Starting spin with freespins:', freespins);

      // 1. Блокируем кнопку
      setLoading(true);
      
      // 2. Получаем результат от сервера
      const data = await spin(bet);
      console.log('Server response:', {
        currentFreespins: freespins,
        newFreespins: data.freespins,
        balance: data.balance
      });
      
      // Запускаем анимацию и звуки
      playSpinClick();
      playSpinLoop();
      
      // Устанавливаем результат для отображения
      setResult(data.result);
      
      // Сохраняем все необходимые данные
      window._spinData = {
        balance: data.balance,
        payout: data.payout,
        comboName: data.combo_name,
        matchedPositions: data.matchedPositions,
        jackpot_win: data.jackpot_win,
        currentFreespins: freespins, // Текущие фриспины
        newFreespins: data.freespins // Новые фриспины от комбинации
      };
      
    } catch (error) {
      console.error('Spin error:', error);
      setError(error.message || 'Произошла ошибка при вращении');
      setLoading(false);
    }
  };

  const getSymbolEmoji = (id, imgSize = CELL_SIZE, emojiSize = CELL_SIZE) => {
    const sym = symbols.find(s => s.id === id);
    if (!sym) return id;
    if (sym.image) {
      return <img src={"/assets/" + sym.image} alt={id} style={{ width: imgSize, height: imgSize, objectFit: 'contain' }} />;
    }
    return <span style={{ fontSize: emojiSize }}>{sym.emoji}</span>;
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
  
  console.log('Spin button state:', {
    loading,
    noChips,
    balance,
    bet,
    freespins,
    disableSpin
  });

  if (!isLoggedIn) {
    return (
      <ErrorBoundary>
        <Layout>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Добро пожаловать в игру!</h2>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowLogin(true)}>Войти</button>
              <button onClick={() => setShowRegister(true)} style={{ marginLeft: '10px' }}>Регистрация</button>
            </div>
          </div>

          <Modal 
            isOpen={showLogin} 
            onClose={() => setShowLogin(false)}
          >
            <LoginForm 
              onSuccess={() => {
                setShowLogin(false);
                setIsLoggedIn(true);
                setCurrentUser(getCurrentUser());
              }}
            />
          </Modal>

          <Modal
            isOpen={showRegister}
            onClose={() => setShowRegister(false)}
          >
            <RegisterForm
              onSuccess={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
            />
          </Modal>
        </Layout>
      </ErrorBoundary>
    );
  }

  if (isInitialLoading) {
    return (
      <ErrorBoundary>
        <Layout>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загрузка игры...</div>
          </div>
        </Layout>
      </ErrorBoundary>
    );
  }

  if (appError) {
    return (
      <ErrorBoundary>
        <Layout>
          <div className="error-container">
            <div className="error-message">
              Произошла ошибка при загрузке игры:
              <br />
              {appError}
            </div>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </button>
          </div>
        </Layout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout
        currentUser={currentUser}
        setIsLoggedIn={setIsLoggedIn}
        setCurrentUser={setCurrentUser}
      >
        <div className="app-card">
          <div className="top-stats">
            <TopBalance balance={balance} />
            <TopBet bet={bet} />
          </div>
          <Jackpot />
          <PixiSlotMachine 
            symbols={symbols}
            result={result}
            cellSize={CELL_SIZE}
            matchedPositions={matchedPositions}
            onSpinComplete={() => {
              stopSpinLoop();
              setLoading(false);
              
              // Получаем сохраненные данные
              const data = window._spinData;
              if (data) {
                setBalance(data.balance);
                // Правильно обновляем фриспины:
                // Если был использован фриспин, вычитаем 1 и добавляем новые
                const updatedFreespins = Math.max(0, data.currentFreespins - 1) + data.newFreespins;
                setFreespins(updatedFreespins);
                
                if (data.payout) setPayout(data.payout);
                if (data.comboName) setComboName(data.comboName);
                if (data.matchedPositions) setMatchedPositions(data.matchedPositions);
                if (data.jackpot_win) setJackpotWin(true);
                
                // Очищаем сохраненные данные
                delete window._spinData;
              }
              
              // Проверяем выигрыш
              if (data?.payout > 0 || data?.jackpot_win) {
                setShowWinModal(true);
              }
            }}
          />
          <Modal 
            isOpen={showWinModal} 
            onClose={() => setShowWinModal(false)}
          >
            <WinInfo 
              comboName={comboName}
              payout={payout}
            />
          </Modal>
          
          <div className="controls-container">
            <div className="controls-left">
              <button
                className="spin-btn"
                onClick={handleSpin}
                disabled={disableSpin}
              >
                {loading ? 'Вращение...' : 'Крутить'}
              </button>
              <button
                className={`autospin ${autoSpin ? 'selected' : ''}`}
                onClick={() => setAutoSpin(!autoSpin)}
                disabled={disableSpin}
              >
                {autoSpin ? 'Стоп' : 'Авто'}
              </button>
            </div>
            <div className="controls-right">
              <BetSelector 
                bet={bet} 
                onBetChange={updateBet}
                disabled={balance <= 0 && freespins === 0}
              />
            </div>
          </div>
          
          <FreespinsDisplay count={freespins} />
          
          <UserStats />
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;

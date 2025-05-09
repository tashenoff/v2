import React, { useState, useEffect } from 'react';
import LastWin from './LastWin';
import LastBet from './LastBet';
import './UserStats.css';

function UserStats() {
  const [stats, setStats] = useState({
    spins_count: 0,
    total_wins: 0,
    total_bets: 0,
    biggest_win: 0,
    jackpot_wins: 0,
    last_spin: null,
    last_win: null,
    last_bet: null
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Ошибка получения статистики');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет данных';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div>
      <div className="user-stats" style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#ffd700' }}>Статистика игры</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px' 
        }}>
          <div className="stat-item">
            <div className="stat-label">Всего спинов:</div>
            <div className="stat-value">{formatNumber(stats.spins_count)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Общий выигрыш:</div>
            <div className="stat-value" style={{ color: '#4CAF50' }}>{formatNumber(stats.total_wins)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Общая сумма ставок:</div>
            <div className="stat-value">{formatNumber(stats.total_bets)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Максимальный выигрыш:</div>
            <div className="stat-value" style={{ color: '#ffd700' }}>{formatNumber(stats.biggest_win)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Джекпотов выиграно:</div>
            <div className="stat-value" style={{ color: '#ff4081' }}>{stats.jackpot_wins}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Последний спин:</div>
            <div className="stat-value" style={{ fontSize: '0.9em' }}>{formatDate(stats.last_spin)}</div>
          </div>
        </div>
      </div>
      <LastBet lastBet={stats.last_bet} />
      <LastWin lastWin={stats.last_win} />
    </div>
  );
}

export default UserStats; 
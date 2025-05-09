import React from 'react';
import BetSelector from './BetSelector';

const GameCard = ({ bet, onBetChange, freespins }) => {
  return (
    <div className="game-card">
      {freespins > 0 && (
        <div className="freespins-info">
          Фриспины: {freespins}
        </div>
      )}
    </div>
  );
};

export default GameCard; 
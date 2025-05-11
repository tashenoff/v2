import React from 'react';
import { logout } from '../services/auth';

const Header = ({ currentUser, setIsLoggedIn, setCurrentUser }) => {
  return (
    <div className="header">
      <div className="header-content">
        <span className="username">Привет, {currentUser?.username}!</span>
        <button 
          className="logout-btn"
          onClick={() => {
            logout();
            setIsLoggedIn(false);
            setCurrentUser(null);
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Header; 
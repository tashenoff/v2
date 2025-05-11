import React from 'react';
import Header from './components/Header';
import './components/Header.css';
import './Layout.css';

const Layout = ({ children, currentUser, setIsLoggedIn, setCurrentUser }) => {
  return (
    <div className="layout">
      {currentUser && (
        <Header 
          currentUser={currentUser}
          setIsLoggedIn={setIsLoggedIn}
          setCurrentUser={setCurrentUser}
        />
      )}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout; 
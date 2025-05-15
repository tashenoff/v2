import React, { useState } from 'react';
import { isAuthenticated, getCurrentUser } from './services/auth';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import AuthenticationComponent from './components/Auth/AuthenticationComponent';
import LoadingStates from './components/LoadingStates';
import GameContainer from './components/GameContainer';

function App() {
  console.log('App component initialization started');
  
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  
  // Имитируем окончание начальной загрузки
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
  };
  
  return (
    <ErrorBoundary>
      <AuthenticationComponent onLogin={handleLogin}>
        <LoadingStates
          isLoading={isInitialLoading}
          error={appError}
          onRetry={() => window.location.reload()}
        >
          <GameContainer
            currentUser={currentUser}
            setIsLoggedIn={setIsLoggedIn}
            setCurrentUser={setCurrentUser}
          />
        </LoadingStates>
      </AuthenticationComponent>
    </ErrorBoundary>
  );
}

export default App;

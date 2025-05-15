import React, { useState } from 'react';
import { isAuthenticated, getCurrentUser } from '../../services/auth';
import Modal from '../Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Layout from '../../Layout';

const AuthenticationComponent = ({ children, onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  
  // Если пользователь уже авторизован, показываем детей (основной интерфейс)
  if (isLoggedIn) {
    return children;
  }
  
  return (
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
            if (onLogin) onLogin(getCurrentUser());
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
  );
};

export default AuthenticationComponent; 
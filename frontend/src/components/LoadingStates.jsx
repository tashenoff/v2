import React from 'react';
import Layout from '../Layout';

const LoadingStates = ({ isLoading, error, onRetry, children }) => {
  if (isLoading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Загрузка игры...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-container">
          <div className="error-message">
            Произошла ошибка при загрузке игры:
            <br />
            {error}
          </div>
          <button 
            className="retry-button"
            onClick={onRetry || (() => window.location.reload())}
          >
            Попробовать снова
          </button>
        </div>
      </Layout>
    );
  }

  return children;
};

export default LoadingStates; 
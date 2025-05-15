import React, { Component } from 'react';

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

export default ErrorBoundary; 
import React from 'react';
import './Layout.css';

const Layout = ({ children }) => (
  <div className="layout-root">
    <header className="layout-header">
      <span className="layout-title">Слот-машина</span>
    </header>
      <main className="layout-main">
        {children}
      </main>
    <footer className="layout-footer">
      <span>© 2024 Слот-машина</span>
    </footer>
  </div>
);

export default Layout; 
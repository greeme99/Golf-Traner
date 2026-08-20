import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, History as HistoryIcon, Moon, Sun } from 'lucide-react';
import './AppLayout.css';

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(p => !p);

  return (
    <div className="app-container">
      <nav className="side-nav">
        <h1 className="logo">Smart Swing</h1>
        <div className="nav-items-container">
          <button 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <Home size={24} />
            <span>Home</span>
          </button>
          <button 
            className="nav-item nav-fab"
            onClick={() => navigate('/upload')}
          >
            <div className="fab-icon">
              <PlusCircle size={32} />
            </div>
            <span>Analysis</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
            onClick={() => navigate('/history')}
          >
            <HistoryIcon size={24} />
            <span>History</span>
          </button>
        </div>
        <div className="nav-bottom-actions" style={{ marginTop: 'auto', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            <span className="theme-label" style={{ fontSize: '0.875rem' }}>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </nav>

      <div className="main-wrapper">
        <header className="app-header-mobile">
          <h1 className="logo-mobile">Smart Swing</h1>
          <button className="theme-toggle-btn" onClick={toggleTheme} style={{ color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>
        
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

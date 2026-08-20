import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splash.css';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to dashboard after 2 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="splash-logo">
        <h1>Smart Swing</h1>
        <p>AI Golf Swing Analyzer</p>
      </div>
    </div>
  );
};

export default Splash;

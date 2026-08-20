import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalysisProvider } from './contexts/AnalysisContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Splash from './pages/Splash';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Result from './pages/Result';
import History from './pages/History';

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Splash />} />
          
          {/* Pages with AppLayout (Header/Navigation) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </Router>
    </AnalysisProvider>
  );
}

export default App;

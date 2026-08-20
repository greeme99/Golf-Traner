import { createContext, useState, useEffect } from 'react';

export const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem('sst_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const startAnalysis = (videoData) => {
    setCurrentAnalysis({
      id: Date.now(),
      videoData,
      status: 'analyzing', // 'analyzing', 'completed', 'failed'
      progress: 0,
      result: null,
      date: new Date().toISOString()
    });
  };

  const updateProgress = (progress) => {
    setCurrentAnalysis(prev => prev ? { ...prev, progress } : null);
  };

  const completeAnalysis = (result) => {
    setCurrentAnalysis(prev => {
      if (!prev) return null;
      const completed = { ...prev, status: 'completed', result, progress: 100 };
      
      // Add to history
      const newHistory = [completed, ...history];
      setHistory(newHistory);
      
      try {
        localStorage.setItem('sst_history', JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Storage quota exceeded. Stripping base64 images to save space.', error);
        try {
          const strippedHistory = newHistory.map(item => ({
            ...item,
            videoData: null,
            result: item.result ? {
              ...item.result,
              phases: (item.result.phases || []).map(p => ({ ...p, thumbnail: null }))
            } : null
          }));
          // Keep only the latest 10 to be safe
          const truncated = strippedHistory.slice(0, 10);
          localStorage.setItem('sst_history', JSON.stringify(truncated));
        } catch (e) {
          console.error('Still failing to save to localStorage', e);
        }
      }
      
      return completed;
    });
  };

  const clearCurrentAnalysis = () => {
    setCurrentAnalysis(null);
  };

  return (
    <AnalysisContext.Provider value={{ 
      history, 
      currentAnalysis, 
      startAnalysis, 
      updateProgress, 
      completeAnalysis,
      clearCurrentAnalysis
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

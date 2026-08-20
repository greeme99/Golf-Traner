import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../contexts/AnalysisContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Video, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import introImage from '../assets/intro-image.png';
import './Dashboard.css';

const Dashboard = () => {
  const { history } = useContext(AnalysisContext);
  const navigate = useNavigate();

  const recentHistory = history.slice(0, 3);

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h2>Hello, Golfer!</h2>
        <p>Ready to improve your swing?</p>
      </div>

      <div className="intro-section">
        <div className="intro-image-wrapper">
          <img src={introImage} alt="Smart Swing Trainer Intro" className="intro-image" />
        </div>
        <div className="intro-text">
          <h3>AI 골프 스윙 분석기</h3>
          <p>단 3단계로 완벽한 스윙 피드백을 받아보세요.</p>
        </div>
        <div className="process-flow">
          <Card className="flow-step">
            <div className="step-number">1</div>
            <div className="step-text">영상 업로드</div>
          </Card>
          <ArrowRight className="flow-arrow" size={20} />
          <Card className="flow-step">
            <div className="step-number">2</div>
            <div className="step-text">AI 정밀 분석</div>
          </Card>
          <ArrowRight className="flow-arrow" size={20} />
          <Card className="flow-step">
            <div className="step-number">3</div>
            <div className="step-text">맞춤형 피드백</div>
          </Card>
        </div>
      </div>

      <Card className="dashboard-cta">
        <div className="cta-content">
          <div className="cta-icon">
            <Video size={32} />
          </div>
          <div>
            <h3>Analyze New Swing</h3>
            <p>Upload a video to get AI feedback</p>
          </div>
        </div>
        <Button onClick={() => navigate('/upload')} variant="primary">
          Start Analysis
        </Button>
      </Card>

      <div className="dashboard-section">
        <div className="section-header">
          <h3>Recent Analysis</h3>
          {history.length > 3 && (
            <button onClick={() => navigate('/history')} className="view-all-btn">
              View All <ChevronRight size={16} />
            </button>
          )}
        </div>

        {recentHistory.length > 0 ? (
          <div className="recent-list">
            {recentHistory.map((item) => (
              <Card key={item.id} className="history-card">
                <div className="history-info">
                  <Activity size={20} className="history-icon" />
                  <div>
                    <h4>{new Date(item.date).toLocaleDateString()}</h4>
                    <p>{item.result?.lesson?.title || 'Swing Analysis'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No analysis history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

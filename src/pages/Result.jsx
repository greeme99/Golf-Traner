import { useRef, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../contexts/AnalysisContext';
import { extractEquidistantFrames, extractFramesAtTimestamps } from '../utils/videoUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ReactMarkdown from 'react-markdown';
import { Share2, CheckCircle2, Volume2 } from 'lucide-react';
import OverlayComparison from '../components/analysis/OverlayComparison';
import './Result.css';

const PRO_SWINGS = [
  // VLM(Vision Language Model) 비디오 정밀 분석을 통해 도출한 정확한 스윙 5단계 타임스탬프 (초)
  // [Address, Takeaway, Top, Impact, Finish]
  { id: 'pro1', name: 'Pro Swing 1', src: '/pro-swings/pro-swing-1.mp4', timestamps: [0.5, 1.2, 2.1, 3.1, 4.5] },
  { id: 'pro2', name: 'Pro Swing 2', src: '/pro-swings/pro-swing-2.mp4', timestamps: [0.1, 0.5, 1.0, 1.5, 2.0] },
  { id: 'robot', name: 'Robot Swing', src: '/pro-swings/robot-swing.mp4', timestamps: [2.5, 2.5, 0.5, 6.5, 1.5] }
];

const Result = () => {
  const { currentAnalysis } = useContext(AnalysisContext);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const proVideoRef = useRef(null);
  
  const [selectedPro, setSelectedPro] = useState(PRO_SWINGS[0].src);
  const [proThumbnails, setProThumbnails] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbs = async () => {
      try {
        const proConfig = PRO_SWINGS.find(p => p.src === selectedPro);
        let thumbs;
        if (proConfig && proConfig.timestamps && proConfig.timestamps.length === 5) {
          thumbs = await extractFramesAtTimestamps(selectedPro, proConfig.timestamps);
        } else {
          thumbs = await extractEquidistantFrames(selectedPro, 5);
        }
        if (isMounted) setProThumbnails(thumbs);
      } catch (err) {
        console.error("Failed to extract pro thumbnails", err);
      }
    };
    fetchThumbs();
    return () => { isMounted = false; };
  }, [selectedPro]);

  if (!currentAnalysis || !currentAnalysis.result) {
    return (
      <div className="result-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No analysis result found.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const phases = currentAnalysis.result.phases || [];
  const metrics = currentAnalysis.result.metrics || {};
  const lesson = currentAnalysis.result.lesson || {};

  const handlePlayTTS = () => {
    if (!lesson?.content) return;
    const text = lesson.content.replace(/[#*]/g, '');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>Analysis Result</h2>
        <button className="share-btn">
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>

      <Card className="lesson-card">
        <div className="lesson-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span className="lesson-badge" style={{ marginBottom: 0 }}>1-Point Lesson</span>
          <button className="tts-btn" onClick={handlePlayTTS} title="Listen" style={{ color: 'var(--color-primary)' }}>
            <Volume2 size={20} />
          </button>
        </div>
        <h3 className="lesson-title">{lesson.title || 'AI 코치의 원포인트 레슨'}</h3>
        <div className="lesson-content markdown-body">
          <ReactMarkdown>{lesson.content || '분석 결과를 불러올 수 없습니다.'}</ReactMarkdown>
        </div>
      </Card>

      <div className="phases-section">
        <h3>Swing Phases</h3>
        <div className="phases-scroll">
          {phases.map((phase, idx) => (
            <div key={idx} className="phase-item">
              <div className="side-by-side-thumbs">
                <div className="thumb-container">
                  <span className="thumb-label">Me</span>
                  <div className="phase-thumb">
                    {phase.thumbnail ? (
                      <img src={phase.thumbnail} alt={phase.name} />
                    ) : (
                      <span className="thumb-placeholder">{idx + 1}</span>
                    )}
                  </div>
                </div>
                <div className="thumb-container">
                  <span className="thumb-label pro-label">Pro</span>
                  <div className="phase-thumb pro-thumb">
                    {proThumbnails[idx] ? (
                      <img src={proThumbnails[idx]} alt="Pro Phase" />
                    ) : (
                      <span className="thumb-placeholder">P</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="phase-name">{phase.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-section">
        <h3>Key Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Tempo (B:D)</span>
            <span className="metric-value">{metrics.tempo || '-'}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Spine Angle</span>
            <span className="metric-value">{metrics.spineAngle || '-'}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Head Mvmt</span>
            <span className="metric-value">{metrics.headMovement || '-'}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Club Speed</span>
            <span className="metric-value">{metrics.clubSpeed || '-'}</span>
          </div>
        </div>
      </div>

      <div className="slow-mo-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h3 style={{ margin: 0 }}>Slow Motion Replay</h3>
          <select 
            value={selectedPro} 
            onChange={(e) => setSelectedPro(e.target.value)}
            className="pro-select"
          >
            {PRO_SWINGS.map(pro => (
              <option key={pro.id} value={pro.src}>{pro.name}</option>
            ))}
          </select>
        </div>
        <div className="video-player-container dual-video-container">
          <div className="video-wrapper">
            <span className="video-badge">Me</span>
            <video 
              ref={videoRef}
              src={currentAnalysis.videoData?.previewUrl}
              controls
              playsInline
              className="slow-mo-video"
              onLoadedData={() => { if(videoRef.current) videoRef.current.playbackRate = 0.5; }}
            />
          </div>
          <div className="video-wrapper">
            <span className="video-badge pro-badge">Pro</span>
            <video 
              ref={proVideoRef}
              src={selectedPro}
              controls
              playsInline
              className="slow-mo-video"
              onLoadedData={() => { if(proVideoRef.current) proVideoRef.current.playbackRate = 0.5; }}
            />
          </div>
        </div>
      </div>

      {/* Overlay Swing Trajectory Comparison Component (User & Pro Overlay Blend) */}
      <OverlayComparison 
        userVideoSrc={currentAnalysis.videoData?.previewUrl}
        proVideoSrc={selectedPro}
        phases={phases}
      />

      <Button 
        className="done-btn" 
        onClick={() => navigate('/dashboard')}
        variant="primary"
      >
        <CheckCircle2 size={20} />
        Done
      </Button>
    </div>
  );
};

export default Result;

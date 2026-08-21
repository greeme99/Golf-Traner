import { useState, useRef, useEffect } from 'react';
import Card from '../common/Card';
import { Layers, Play, Pause, RotateCcw, Sparkles, Eye, Settings } from 'lucide-react';
import './OverlayComparison.css';

const OverlayComparison = ({ userVideoSrc, proVideoSrc, phases = [] }) => {
  const userVideoRef = useRef(null);
  const proVideoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [blendMode, setBlendMode] = useState(50); // 0 (100% Me) to 100 (100% Pro), 50 (50:50 Overlay)
  const [showTrajectoryLines, setShowTrajectoryLines] = useState(true);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [proScale, setProScale] = useState(1.0);
  const [proSpeed, setProSpeed] = useState(0.5);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Sync playback between both videos
  const togglePlay = () => {
    if (!userVideoRef.current || !proVideoRef.current) return;

    if (isPlaying) {
      userVideoRef.current.pause();
      proVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      userVideoRef.current.play().catch(() => {});
      proVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (userVideoRef.current && proVideoRef.current) {
      userVideoRef.current.currentTime = 0;
      proVideoRef.current.currentTime = 0;
      userVideoRef.current.pause();
      proVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Jump to specific phase timestamp
  const handleJumpToPhase = (index) => {
    setActivePhaseIndex(index);
    if (phases[index] && phases[index].time !== undefined) {
      const targetTime = phases[index].time;
      if (userVideoRef.current) userVideoRef.current.currentTime = targetTime;
      if (proVideoRef.current) proVideoRef.current.currentTime = targetTime;
    }
  };

  useEffect(() => {
    if (proVideoRef.current) {
      proVideoRef.current.playbackRate = proSpeed;
    }
  }, [proSpeed, isPlaying]);

  // Draw Trajectory Comparison Arcs on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!showTrajectoryLines) return;

    // Draw Grid / Center Guide Line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Center vertical spine line
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();

    // Knee / Ground horizontal line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.82);
    ctx.lineTo(width, height * 0.82);
    ctx.stroke();
    ctx.restore();

    // 1. User Swing Trajectory (Blue Arc)
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#0066FF';
    ctx.shadowBlur = 8;

    // Smooth Bezier Curve representing User Hand/Club Path
    ctx.moveTo(width * 0.55, height * 0.75); // Address
    ctx.quadraticCurveTo(
      width * 0.28, height * 0.45, // Takeaway
      width * 0.42, height * 0.18  // Top
    );
    ctx.quadraticCurveTo(
      width * 0.62, height * 0.48, // Downswing
      width * 0.52, height * 0.78  // Impact
    );
    ctx.stroke();
    ctx.restore();

    // 2. Pro Swing Trajectory (Coral Orange Arc)
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#FF6B4A';
    ctx.lineWidth = 3.5;
    ctx.lineDash = [6, 3];
    ctx.lineCap = 'round';
    ctx.shadowColor = '#FF6B4A';
    ctx.shadowBlur = 8;

    // Ideal Pro Path
    ctx.moveTo(width * 0.54, height * 0.75);
    ctx.quadraticCurveTo(
      width * 0.24, height * 0.42,
      width * 0.46, height * 0.16
    );
    ctx.quadraticCurveTo(
      width * 0.56, height * 0.52,
      width * 0.53, height * 0.77
    );
    ctx.stroke();
    ctx.restore();

    // Key Point Indicators (Impact Point Deviation)
    ctx.save();
    // User Impact Point
    ctx.fillStyle = '#0066FF';
    ctx.beginPath();
    ctx.arc(width * 0.52, height * 0.78, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pro Impact Point
    ctx.fillStyle = '#FF6B4A';
    ctx.beginPath();
    ctx.arc(width * 0.53, height * 0.77, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label difference line
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.52, height * 0.78);
    ctx.lineTo(width * 0.53, height * 0.77);
    ctx.stroke();
    ctx.restore();
  }, [showTrajectoryLines, blendMode, activePhaseIndex]);

  // Calculations for opacity blending
  const proOpacity = blendMode / 100;
  const userOpacity = 1 - (blendMode > 50 ? (blendMode - 50) / 100 : 0);

  return (
    <Card className="overlay-comparison-card">
      <div className="overlay-header">
        <div className="overlay-title-group">
          <div className="overlay-icon-badge">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="overlay-title">Swing Trajectory Overlay Comparison</h3>
            <p className="overlay-subtitle">Overlap user & pro swing videos to detect plane & path deviations</p>
          </div>
        </div>

        <div className="overlay-toggle-group">
          <button 
            className={`trajectory-toggle-btn ${showAdjustments ? 'active' : ''}`}
            onClick={() => setShowAdjustments(!showAdjustments)}
            title="Adjust Pro Settings"
          >
            <Settings size={15} />
            <span>Adjust</span>
          </button>
          <button 
            className={`trajectory-toggle-btn ${showTrajectoryLines ? 'active' : ''}`}
            onClick={() => setShowTrajectoryLines(!showTrajectoryLines)}
          >
            <Eye size={15} />
            <span>Path Overlay</span>
          </button>
        </div>
      </div>

      {/* Main Overlay Viewport Container */}
      <div className="overlay-viewport">
        {/* Underlay Video: User (Me) */}
        <video
          ref={userVideoRef}
          src={userVideoSrc}
          className="overlay-video video-user"
          style={{ opacity: userOpacity }}
          playsInline
          muted
          loop
          onLoadedData={() => { if (userVideoRef.current) userVideoRef.current.playbackRate = 0.5; }}
        />

        {/* Overlay Video: Pro */}
        <video
          ref={proVideoRef}
          src={proVideoSrc}
          className="overlay-video video-pro"
          style={{ opacity: proOpacity, transform: `scale(${proScale})` }}
          playsInline
          muted
          loop
          onLoadedData={() => { if (proVideoRef.current) proVideoRef.current.playbackRate = proSpeed; }}
        />

        {/* Trajectory Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={480}
          height={320}
          className="overlay-canvas"
        />

        {/* Floating Controls Bar */}
        <div className="overlay-floating-controls">
          <button className="control-icon-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="control-icon-btn" onClick={handleReset} title="Reset">
            <RotateCcw size={16} />
          </button>

          <div className="blend-slider-container">
            <span className="blend-label label-user">Me ({100 - blendMode}%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={blendMode}
              onChange={(e) => setBlendMode(Number(e.target.value))}
              className="blend-range-slider"
            />
            <span className="blend-label label-pro">Pro ({blendMode}%)</span>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="overlay-legend">
          <div className="legend-item">
            <span className="legend-dot user-dot"></span>
            <span>My Path (Blue)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot pro-dot"></span>
            <span>Pro Ideal Path (Orange)</span>
          </div>
        </div>

        {/* Adjustments Panel */}
        {showAdjustments && (
          <div className="overlay-adjust-panel">
            <div className="adjust-row">
              <span className="adjust-label">Pro Scale: {proScale.toFixed(2)}x</span>
              <input 
                type="range" min="0.5" max="2.0" step="0.05" 
                value={proScale} 
                onChange={(e) => setProScale(Number(e.target.value))} 
                className="adjust-slider"
              />
            </div>
            <div className="adjust-row">
              <span className="adjust-label">Pro Speed: {proSpeed.toFixed(2)}x</span>
              <input 
                type="range" min="0.1" max="2.0" step="0.05" 
                value={proSpeed} 
                onChange={(e) => setProSpeed(Number(e.target.value))} 
                className="adjust-slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Swing Phase Sync Selector */}
      {phases.length > 0 && (
        <div className="phase-sync-bar">
          <span className="phase-sync-title">Sync Phase Point:</span>
          <div className="phase-pills">
            {phases.map((phase, idx) => (
              <button
                key={idx}
                className={`phase-sync-pill ${activePhaseIndex === idx ? 'active' : ''}`}
                onClick={() => handleJumpToPhase(idx)}
              >
                {phase.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trajectory Biomechanics Summary Badges */}
      <div className="trajectory-metrics-row">
        <div className="traj-metric-badge">
          <Sparkles size={14} className="traj-icon" />
          <span className="traj-label">Path Similarity:</span>
          <span className="traj-value val-high">86.4% Match</span>
        </div>
        <div className="traj-metric-badge">
          <span className="traj-label">Backswing Deviation:</span>
          <span className="traj-value">+2.8cm Outward</span>
        </div>
        <div className="traj-metric-badge">
          <span className="traj-label">Impact Plane Delta:</span>
          <span className="traj-value val-warn">Out-to-In (-3.2°)</span>
        </div>
      </div>
    </Card>
  );
};

export default OverlayComparison;

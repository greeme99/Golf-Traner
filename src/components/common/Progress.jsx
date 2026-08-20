import './Progress.css';

const Progress = ({ value = 0, label }) => {
  return (
    <div className="progress-wrapper">
      <div className="progress-header">
        {label && <span className="progress-label">{label}</span>}
        <span className="progress-percentage">{Math.round(value)}%</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;

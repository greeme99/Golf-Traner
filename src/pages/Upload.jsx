import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../contexts/AnalysisContext';
import { Upload as UploadIcon, X, Camera, Square, Video } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import './Upload.css';

const Upload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'camera'
  const [cameraAngle, setCameraAngle] = useState('auto');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const liveVideoRef = useRef(null);

  const { startAnalysis } = useContext(AnalysisContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMode('upload');
    }
  };

  const clearSelection = () => {
    if (previewUrl && !isRecording) {
      URL.revokeObjectURL(previewUrl);
    }
    setVideoFile(null);
    setPreviewUrl('');
    stopCamera();
    setMode('upload');
  };

  const handleStartAnalysis = () => {
    if (!videoFile && !previewUrl) return;
    startAnalysis({
      file: videoFile,
      previewUrl: previewUrl,
      cameraAngle: cameraAngle,
      timestamp: new Date().toISOString()
    });
    navigate('/analysis');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera if available
        audio: false 
      });
      setStream(mediaStream);
      setMode('camera');
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied or error:", err);
      alert("카메라 접근 권한이 필요합니다.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoFile(blob);
      setPreviewUrl(url);
      setMode('upload'); // Switch back to preview mode
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>New Analysis</h2>
      
      {!previewUrl && mode !== 'camera' && (
        <Card className="upload-zone">
          <label className="upload-prompt">
            <div className="upload-icon-wrapper">
              <UploadIcon size={32} className="upload-icon" />
            </div>
            <h3>Select Video</h3>
            <p>Upload a clear side-view golf swing</p>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden-input" 
              onChange={handleFileChange}
            />
          </label>
          <div className="divider"><span>OR</span></div>
          <Button variant="outline" className="camera-btn" onClick={startCamera}>
            <Camera size={18} />
            Use Camera
          </Button>
        </Card>
      )}

      {mode === 'camera' && (
        <div className="preview-zone">
          <div className="preview-header">
            <h3>Record Swing</h3>
            <button className="clear-btn" onClick={clearSelection}>
              <X size={20} />
            </button>
          </div>
          <div className="video-preview-wrapper live-wrapper">
            <video 
              ref={liveVideoRef}
              autoPlay 
              playsInline 
              muted 
              className="video-preview live-video"
            />
            {isRecording && <div className="recording-indicator" />}
          </div>
          <div className="camera-controls">
            {!isRecording ? (
              <button className="record-btn start" onClick={startRecording}>
                <Video size={24} />
              </button>
            ) : (
              <button className="record-btn stop" onClick={stopRecording}>
                <Square size={24} />
              </button>
            )}
          </div>
        </div>
      )}

      {previewUrl && mode !== 'camera' && (
        <div className="preview-zone">
          <div className="preview-header">
            <h3>Selected Video</h3>
            <button className="clear-btn" onClick={clearSelection}>
              <X size={20} />
            </button>
          </div>
          <div className="video-preview-wrapper">
            <video 
              src={previewUrl} 
              controls 
              className="video-preview"
              playsInline
            />
          </div>

          <div className="angle-selector">
            <h4>촬영 방향 선택</h4>
            <div className="angle-options">
              <label className={`angle-option ${cameraAngle === 'auto' ? 'selected' : ''}`}>
                <input type="radio" value="auto" checked={cameraAngle === 'auto'} onChange={(e) => setCameraAngle(e.target.value)} />
                Auto
              </label>
              <label className={`angle-option ${cameraAngle === 'front' ? 'selected' : ''}`}>
                <input type="radio" value="front" checked={cameraAngle === 'front'} onChange={(e) => setCameraAngle(e.target.value)} />
                정면
              </label>
              <label className={`angle-option ${cameraAngle === 'side' ? 'selected' : ''}`}>
                <input type="radio" value="side" checked={cameraAngle === 'side'} onChange={(e) => setCameraAngle(e.target.value)} />
                측면
              </label>
              <label className={`angle-option ${cameraAngle === 'back' ? 'selected' : ''}`}>
                <input type="radio" value="back" checked={cameraAngle === 'back'} onChange={(e) => setCameraAngle(e.target.value)} />
                후면
              </label>
            </div>
          </div>

          <Button 
            className="start-btn" 
            variant="primary" 
            onClick={handleStartAnalysis}
          >
            Start Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default Upload;

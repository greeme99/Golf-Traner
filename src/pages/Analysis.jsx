import { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisContext } from '../contexts/AnalysisContext';
import { extractPoseLandmarks } from '../services/poseService';
import { analyzeSwingPhases } from '../services/swingNetMock';
import { analyzeSwingWithBackend } from '../services/apiService';
import { generateOnePointLesson } from '../services/geminiService';
import { extractFrameAsImage, drawSkeletonOnCanvas, detectCameraAngle } from '../utils/videoUtils';
import Progress from '../components/common/Progress';
import Skeleton from '../components/common/Skeleton';
import './Analysis.css';

const Analysis = () => {
  const { currentAnalysis, updateProgress, completeAnalysis } = useContext(AnalysisContext);
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState('Extracting Pose Landmarks...');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!currentAnalysis) {
      navigate('/dashboard');
      return;
    }

    const runAnalysis = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      try {
        // Wait for video to be ready
        if (!videoRef.current) {
           await new Promise(resolve => setTimeout(resolve, 500));
        }

        let swingResult;
        const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

        if (USE_BACKEND && currentAnalysis.videoData?.file) {
          // A: Remote Backend Analysis
          setStatusText('Uploading video to backend API...');
          swingResult = await analyzeSwingWithBackend(currentAnalysis.videoData.file, currentAnalysis.cameraAngle, (prog) => {
            updateProgress(Math.floor(prog * 0.6)); // 0-60% for upload
          });
          
          // Re-sync landmarks if needed (fallback to client-side visualization)
          // For MVP we just use the returned timestamps without skeletons if backend doesn't return them
        } else {
          // B: Client-side MediaPipe Analysis
          setStatusText('Analyzing pose with MediaPipe...');
          let poseData = [];
          try {
            poseData = await extractPoseLandmarks(videoRef.current, (prog, currentLandmarks) => {
              updateProgress(Math.floor(prog * 0.4)); // 0-40%
              
              if (currentLandmarks && canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const vw = videoRef.current.videoWidth;
                const vh = videoRef.current.videoHeight;
                if (vw && vh) {
                  if (canvasRef.current.width !== vw) canvasRef.current.width = vw;
                  if (canvasRef.current.height !== vh) canvasRef.current.height = vh;
                  ctx.clearRect(0, 0, vw, vh);
                  drawSkeletonOnCanvas(ctx, vw, vh, currentLandmarks);
                }
              }
            });
          } catch (e) {
            console.warn("Mediapipe extraction failed. Falling back to mock data.", e);
            // poseData remains empty array
          }

          // SwingNet Mock Analysis
          setStatusText('Classifying swing phases (SwingNet)...');
          updateProgress(50);
          swingResult = await analyzeSwingPhases(poseData, (prog) => {
             updateProgress(40 + Math.floor(prog * 0.2)); // 40-60%
          });

          // Detect angle if auto
          let finalAngle = currentAnalysis.cameraAngle || 'auto';
          if (finalAngle === 'auto' && poseData.length > 0) {
             finalAngle = detectCameraAngle(poseData[0].landmarks);
          }
          swingResult.cameraAngle = finalAngle;
        }

        // 3. Extract Thumbnails for UI
        setStatusText('Extracting phase thumbnails...');
        for (const phase of swingResult.phases) {
           phase.thumbnail = await extractFrameAsImage(videoRef.current, phase.time, phase.frame?.landmarks);
        }
        updateProgress(70);

        // 4. LLM Coaching
        setStatusText('Generating One Point Lesson (Gemini API)...');
        const lesson = await generateOnePointLesson(swingResult);
        updateProgress(90);

        // Complete
        setStatusText('Finalizing result...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        completeAnalysis({
          phases: swingResult.phases,
          metrics: swingResult.metrics,
          lesson: lesson
        });

        navigate('/result');
      } catch (error) {
        console.error(error);
        setStatusText(`Analysis failed: ${error.message || error}`);
      }
    };

    if (currentAnalysis.status === 'analyzing') {
      runAnalysis();
    }
  }, [currentAnalysis, navigate, updateProgress, completeAnalysis]);

  return (
    <div className="analysis-container">
      <div className="analysis-video-wrapper">
        {currentAnalysis?.videoData?.previewUrl ? (
          <>
            <video 
            ref={videoRef}
            src={currentAnalysis.videoData.previewUrl} 
            className="analysis-video"
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
          />
          <canvas ref={canvasRef} className="skeleton-overlay-canvas" />
        </>
        ) : (
          <Skeleton width="100%" height="100%" shape="rect" />
        )}
        <div className="analysis-overlay">
          <div className="scanner-line"></div>
        </div>
      </div>
      
      <div className="analysis-status">
        <h3>Analyzing Swing</h3>
        <p>{statusText}</p>
        <Progress value={currentAnalysis?.progress || 0} />
      </div>

      <div className="analysis-skeletons">
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="100px" />
      </div>
    </div>
  );
};

export default Analysis;

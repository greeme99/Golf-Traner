import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker = null;

export const initializePose = async () => {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  return poseLandmarker;
};

/**
 * Extract pose landmarks from a video element over its duration.
 * This is a simplified sequential extraction for the MVP.
 * In a real scenario, this would extract frame-by-frame via requestVideoFrameCallback.
 */
export const extractPoseLandmarks = async (videoElement, onProgress) => {
  if (!poseLandmarker) {
    await initializePose();
  }

  return new Promise((resolve) => {
    const landmarksData = [];
    const videoDuration = videoElement.duration || 3.0; // Default to 3s if unknown
    
    // We will extract 30 frames
    const numFrames = 30;
    const timeStep = videoDuration / numFrames;
    let currentFrameIndex = 0;
    
    const originalTime = videoElement.currentTime;
    
    const processNextFrame = () => {
      if (currentFrameIndex >= numFrames) {
        // Cleanup and finish
        videoElement.currentTime = originalTime;
        resolve(landmarksData);
        return;
      }
      
      const currentTime = currentFrameIndex * timeStep;
      
      const onSeeked = () => {
        let currentLandmarks = null;
        // Extract landmarks for this frame
        try {
          const result = poseLandmarker.detectForVideo(videoElement, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
            currentLandmarks = result.landmarks[0];
            landmarksData.push({
              time: currentTime,
              landmarks: currentLandmarks
            });
          }
        } catch (e) {
          console.error("Pose extraction error at frame", currentFrameIndex, e);
        }

        // Report progress
        if (onProgress) {
          onProgress(Math.floor((currentFrameIndex / numFrames) * 100), currentLandmarks);
        }
        
        // Go to next frame
        currentFrameIndex++;
        videoElement.removeEventListener('seeked', onSeeked);
        processNextFrame();
      };
      
      videoElement.addEventListener('seeked', onSeeked);
      videoElement.currentTime = currentTime;
    };
    
    // Start processing
    processNextFrame();
  });
};

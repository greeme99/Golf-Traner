/**
 * Extracts a frame from a video element at a specific timestamp.
 * 
 * @param {HTMLVideoElement} videoElement The video element
 * @param {number} timeInSeconds The time to extract the frame from
 * @param {Array} landmarks Optional array of landmarks to draw on the frame
 * @returns {Promise<string>} Base64 encoded image string (data:image/jpeg;base64,...)
 */
export const extractFrameAsImage = (videoElement, timeInSeconds, landmarks = null) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Save original time
    const originalTime = videoElement.currentTime;
    
    // Set up one-time event listener for when it seeks to the desired time
    const onSeeked = () => {
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the current frame onto the canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Optionally draw skeleton if landmarks provided
      if (landmarks) {
        drawSkeletonOnCanvas(context, canvas.width, canvas.height, landmarks);
      }
      
      // Convert to base64 jpeg
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // Restore original time
      videoElement.currentTime = originalTime;
      
      // Clean up event listener
      videoElement.removeEventListener('seeked', onSeeked);
      
      resolve(dataUrl);
    };
    
    videoElement.addEventListener('seeked', onSeeked);
    
    // Trigger seek
    videoElement.currentTime = timeInSeconds;
  });
};

/**
 * Draws a basic skeleton on the provided canvas context using MediaPipe landmarks.
 */
export const drawSkeletonOnCanvas = (ctx, width, height, landmarks) => {
  if (!landmarks || landmarks.length === 0) return;

  // Standard connections for MediaPipe Pose
  const connections = [
    [11, 13], [13, 15], [12, 14], [14, 16], // arms
    [11, 12], [23, 24], [11, 23], [12, 24], // torso
    [23, 25], [25, 27], [24, 26], [26, 28]  // legs
  ];

  ctx.save();
  
  // Draw lines
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 3;
  for (const [startIdx, endIdx] of connections) {
    const startNode = landmarks[startIdx];
    const endNode = landmarks[endIdx];
    if (startNode && endNode && startNode.visibility > 0.5 && endNode.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startNode.x * width, startNode.y * height);
      ctx.lineTo(endNode.x * width, endNode.y * height);
      ctx.stroke();
    }
  }

  // Draw points
  ctx.fillStyle = '#FF0000';
  for (const node of landmarks) {
    if (node.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(node.x * width, node.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  
  ctx.restore();
};

/**
 * Detects the camera angle (front, side, back) based on a single frame's pose landmarks.
 * @param {Array} landmarks The MediaPipe landmarks array.
 * @returns {string} 'front', 'side', 'back', or 'auto' (if undetermined).
 */
export const detectCameraAngle = (landmarks) => {
  if (!landmarks || landmarks.length < 33) return 'auto';
  
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const nose = landmarks[0];
  
  if (!leftShoulder || !rightShoulder || !nose) return 'auto';
  if (leftShoulder.visibility < 0.5 && rightShoulder.visibility < 0.5) return 'auto';

  // Calculate X distance between shoulders
  const shoulderWidthX = Math.abs(leftShoulder.x - rightShoulder.x);
  
  // In MediaPipe, smaller (more negative) Z means closer to the camera.
  const noseZ = nose.z;
  const avgShoulderZ = (leftShoulder.z + rightShoulder.z) / 2;

  // If shoulders overlap heavily on X axis, the camera is to the side.
  if (shoulderWidthX < 0.12) {
    return 'side';
  }

  // If shoulders are wide apart, determine if player faces camera or away from camera
  if (noseZ < avgShoulderZ) {
    return 'front';
  } else {
    return 'back';
  }
};

/**
 * Extracts N equidistant frames from a video URL.
 * 
 * @param {string} videoUrl The source URL of the video
 * @param {number} numFrames The number of frames to extract (default 5)
 * @returns {Promise<Array<string>>} Array of base64 image strings
 */
export const extractEquidistantFrames = (videoUrl, numFrames = 5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = async () => {
      const duration = video.duration;
      const frames = [];
      // Calculate timepoints: 10%, 30%, 50%, 70%, 90% (approx) to avoid black frames at boundaries
      const timepoints = [];
      for(let i = 0; i < numFrames; i++) {
        timepoints.push(duration * (0.1 + 0.8 * (i / Math.max(1, numFrames - 1))));
      }

      try {
        for (const t of timepoints) {
          const frame = await extractFrameAsImage(video, t);
          frames.push(frame);
        }
        resolve(frames);
      } catch (e) {
        reject(e);
      }
    };
    video.onerror = reject;
  });
};

export const extractFramesAtTimestamps = (videoUrl, timestamps) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = async () => {
      const frames = [];
      try {
        for (const t of timestamps) {
          const frame = await extractFrameAsImage(video, t);
          frames.push(frame);
        }
        resolve(frames);
      } catch (e) {
        reject(e);
      }
    };
    video.onerror = reject;
  });
};

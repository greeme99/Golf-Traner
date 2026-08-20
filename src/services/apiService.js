/**
 * API Service for communicating with a future Python/Flask backend.
 * Currently returns a simulated successful response structure, 
 * ready to be swapped with a real fetch() call when the backend is ready.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export { BACKEND_URL };

export const analyzeSwingWithBackend = async (_videoFile, cameraAngle, onProgress) => {
  return new Promise((resolve) => {
    // Simulated upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (onProgress) onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // This simulates a response from a real PyTorch model running on a server
        resolve({
          cameraAngle: cameraAngle === 'auto' ? 'side' : cameraAngle, // Assume backend detected 'side' if auto
          phases: [
            { name: 'Address', time: 0.2 },
            { name: 'Takeaway', time: 0.8 },
            { name: 'Top', time: 1.5 },
            { name: 'Impact', time: 1.8 },
            { name: 'Finish', time: 2.3 }
          ],
          metrics: {
            tempo: '3.0:1',
            spineAngle: '25°',
            headMovement: 'Excellent',
            clubSpeed: '98mph'
          }
        });
      }
    }, 200);
    
    /* 
    // REAL IMPLEMENTATION (Uncomment when backend is active)
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('cameraAngle', cameraAngle);
      
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
    */
  });
};

import { useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ src, onVideoLoad, className = '', autoPlay = false, loop = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && src) {
      // In a real app we'd load the file properly
      if (typeof src === 'string') {
        videoRef.current.src = src;
      } else if (src instanceof File) {
        videoRef.current.src = URL.createObjectURL(src);
      }
    }
  }, [src]);

  const handleLoadedData = () => {
    if (onVideoLoad && videoRef.current) {
      onVideoLoad(videoRef.current);
    }
  };

  return (
    <div className={`video-container ${className}`}>
      <video
        ref={videoRef}
        className="video-element"
        autoPlay={autoPlay}
        loop={loop}
        muted
        playsInline
        onLoadedData={handleLoadedData}
      />
    </div>
  );
};

export default VideoPlayer;

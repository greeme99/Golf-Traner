import './Skeleton.css';

const Skeleton = ({ width, height, className = '', shape = 'rect' }) => {
  return (
    <div 
      className={`skeleton skeleton-${shape} ${className}`}
      style={{ width, height }}
    />
  );
};

export default Skeleton;

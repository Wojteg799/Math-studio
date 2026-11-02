import React from 'react';

interface CameraFrameProps {
  className?: string;
}

export const CameraFrame: React.FC<CameraFrameProps> = ({
  className = ''
}) => {
  return (
    <div
      style={{
        width: 472,
        height: 290
      }}
      className={`relative rounded-2xl bg-transparent border border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.6)] pointer-events-none ${className}`}
    />
  );
};

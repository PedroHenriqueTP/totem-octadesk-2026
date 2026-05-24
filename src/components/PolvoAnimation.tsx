import React from 'react';

interface PolvoAnimationProps {
  status: 'idle' | 'processing' | 'success';
}

export const PolvoAnimation: React.FC<PolvoAnimationProps> = ({ status }) => {
  const lottieAssets = {
    idle: '/assets/mascot/polvo-headset-idle.json',
    processing: '/assets/assets/mascot/polvo-headset-processing.json',
    success: '/assets/mascot/polvo-headset-success.json',
  };

  const svgFallback = '/assets/mascot/polvo-headset.svg';

  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto dynamic-mascot-container">
      <img 
        src={svgFallback} 
        alt={`Mascote Octadesk - ${status}`} 
        className="object-contain w-full h-full transition-transform duration-500 ease-in-out hover:scale-105"
        data-animation-path={lottieAssets[status]}
      />
    </div>
  );
};

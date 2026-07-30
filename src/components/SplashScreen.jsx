import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  const [stage, setStage] = useState('initial'); // 'initial', 'fading', 'done'

  useEffect(() => {
    // 1. Start fading out very quickly (0.2s pause)
    const timer1 = setTimeout(() => {
      setStage('fading');
    }, 200);

    // 2. Remove from DOM after fade finishes (0.2s + 0.6s fade = 0.8s total)
    const timer2 = setTimeout(() => {
      setStage('done');
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (stage === 'done') return null;

  return (
    <div className={`splash-container ${stage}`}>
      <div className="splash-background"></div>
    </div>
  );
};

export default SplashScreen;

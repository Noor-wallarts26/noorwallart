import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { X } from 'lucide-react';
import './SplashScreen.css';

// Inline Instagram SVG icon for 100% build reliability
const InstagramIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const SplashScreen = () => {
  const { storeSettings } = useContext(ShopContext);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const rawInstagram = storeSettings?.instagram || '@noorkarts';
  const instagramUrl = rawInstagram.startsWith('http')
    ? rawInstagram
    : `https://instagram.com/${rawInstagram.replace('@', '').trim()}`;

  // 5-Second Auto Close Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500); // Matches CSS transition duration
  };

  const handleInstagramClick = (e) => {
    e.stopPropagation();
    window.open(instagramUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className={`splash-fullscreen-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      
      {/* Top-Right Skip Button */}
      <button 
        type="button" 
        className="splash-skip-btn" 
        onClick={handleClose}
        aria-label="Skip to Homepage"
      >
        <span>Skip</span>
        <X size={16} />
      </button>

      {/* Ambient Background Glows */}
      <div className="splash-glow glow-saffron"></div>
      <div className="splash-glow glow-green"></div>

      {/* Background Rotating Ashoka Chakra */}
      <div className="splash-chakra-watermark">
        <svg viewBox="0 0 100 100" width="380" height="380" opacity="0.045">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="6" fill="#000080" />
          {[...Array(24)].map((_, i) => (
            <line 
              key={i} 
              x1="50" 
              y1="50" 
              x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)} 
              y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)} 
              stroke="#000080" 
              strokeWidth="1.2" 
            />
          ))}
        </svg>
      </div>

      {/* Floating Sparkle Particles */}
      <div className="sparkle-particle p1">✨</div>
      <div className="sparkle-particle p2">✨</div>
      <div className="sparkle-particle p3">✨</div>

      {/* MAIN POSTER CONTAINER */}
      <div className="poster-wrapper animate-poster-zoom">
        
        {/* Official Independence Day Poster Asset Image */}
        <img 
          src="/independence_poster.jpg" 
          alt="NOOR KARTS Independence Day Offer Poster" 
          className="poster-main-img"
        />

        {/* CLICKABLE INTERACTIVE INSTAGRAM BUTTON OVERLAY */}
        <div className="poster-cta-overlay-container">
          <button 
            type="button" 
            className="interactive-cta-btn"
            onClick={handleInstagramClick}
          >
            <InstagramIcon size={20} color="#FFFFFF" />
            <span>GET THE COUPON</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;

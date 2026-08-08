import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { X, Sparkles } from 'lucide-react';
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
      
      {/* Top-Right Optional Skip Button */}
      <button 
        type="button" 
        className="splash-skip-btn" 
        onClick={handleClose}
        aria-label="Skip to Homepage"
      >
        <span>Skip</span>
        <X size={16} />
      </button>

      {/* Ambient Background Patriotic Glows */}
      <div className="splash-glow glow-saffron"></div>
      <div className="splash-glow glow-green"></div>

      {/* Background Ashoka Chakra Watermark */}
      <div className="splash-chakra-watermark">
        <svg viewBox="0 0 100 100" width="340" height="340" opacity="0.035">
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

      <div className="splash-main-container">
        
        {/* Left Indian Flag / Decoration */}
        <div className="splash-flag-panel flag-left" title="Indian Flag 🇮🇳">
          <div className="flag-stripe saffron"></div>
          <div className="flag-stripe white">
            <div className="flag-chakra-mini">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#000080" strokeWidth="1" />
                <circle cx="12" cy="12" r="2" fill="#000080" />
              </svg>
            </div>
          </div>
          <div className="flag-stripe green"></div>
        </div>

        {/* Center Content Area */}
        <div className="splash-content-box">
          
          {/* BRANDING HEADER */}
          <div className="splash-brand-header">
            <div className="splash-logo-frame">
              <img 
                src="/noor_arts_logo.jpg" 
                onError={(e) => { e.target.src = '/logo.jpg'; }} 
                alt="NOOR WALLETS Logo" 
              />
            </div>
            <h2 className="splash-brand-title">NOOR WALLETS</h2>
            <span className="splash-brand-subtitle">PREMIUM ARTS &amp; GIFTS</span>
          </div>

          {/* MAIN PROMOTION HEADINGS */}
          <div className="splash-campaign-wrapper">
            <div className="splash-flag-icon">🇮🇳</div>
            <h1 className="splash-hero-headline">INDEPENDENCE DAY</h1>
            <p className="splash-offer-badge">SPECIAL OFFER</p>
            <h3 className="splash-coupon-title">SPECIAL COUPON CODE OFFER</h3>
          </div>

          {/* URGENCY & COUPON BOX */}
          <div className="splash-urgency-card">
            <div className="splash-limited-tag">LIMITED OFFER</div>
            <div className="splash-urgency-sub">FIRST 50 CUSTOMERS ONLY</div>
            <div className="splash-fast-text">GET YOUR COUPON CODE FAST</div>

            {/* INSTAGRAM CTA BUTTON */}
            <button 
              type="button" 
              className="splash-cta-btn"
              onClick={handleInstagramClick}
            >
              <InstagramIcon size={20} color="#FFFFFF" />
              <span>GET COUPON CODE 🇮🇳</span>
            </button>

            <div className="splash-inst-text">FOLLOW OUR INSTAGRAM PAGE</div>
            <div className="splash-grab-tag">GRAB YOUR OFFER</div>
          </div>

          {/* BOTTOM FESTIVE GREETING */}
          <div className="splash-bottom-greeting">
            HAPPY INDEPENDENCE DAY 🇮🇳
          </div>

        </div>

        {/* Right Indian Flag / Decoration */}
        <div className="splash-flag-panel flag-right" title="Indian Flag 🇮🇳">
          <div className="flag-stripe saffron"></div>
          <div className="flag-stripe white">
            <div className="flag-chakra-mini">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#000080" strokeWidth="1" />
                <circle cx="12" cy="12" r="2" fill="#000080" />
              </svg>
            </div>
          </div>
          <div className="flag-stripe green"></div>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;

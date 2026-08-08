import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { X } from 'lucide-react';
import './SplashScreen.css';

// Inline Instagram SVG icon
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
    }, 500);
  };

  const handleInstagramClick = (e) => {
    e.stopPropagation();
    window.open(instagramUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className={`splash-fullscreen-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      
      {/* 1. TOP TRICOLOR FABRIC DECORATIVE STRIP */}
      <div className="tricolor-fabric-strip top-strip">
        <div className="strip-stripe saffron"></div>
        <div className="strip-stripe white"></div>
        <div className="strip-stripe green"></div>
      </div>

      {/* 2. BOTTOM TRICOLOR FABRIC DECORATIVE STRIP */}
      <div className="tricolor-fabric-strip bottom-strip">
        <div className="strip-stripe saffron"></div>
        <div className="strip-stripe white"></div>
        <div className="strip-stripe green"></div>
      </div>

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

      {/* Ashoka Chakra Background Watermark (Slow Smooth Rotation) */}
      <div className="splash-chakra-watermark">
        <svg viewBox="0 0 100 100" width="340" height="340" opacity="0.045">
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

      {/* Red Fort Silhouette (Bottom Background) */}
      <div className="red-fort-silhouette">
        <svg viewBox="0 0 1200 320" width="100%" height="160" preserveAspectRatio="none" opacity="0.075">
          <path fill="#7C2D12" d="M0,320 L0,220 L30,220 L30,190 L40,190 L40,170 L60,170 L60,190 L70,190 L70,220 L120,220 L120,180 L130,180 L130,150 L150,150 L150,130 L170,130 L170,150 L190,150 L190,180 L200,180 L200,220 L350,220 L350,140 L370,140 L370,100 L410,100 L410,70 L430,70 L430,50 L470,50 L470,70 L490,70 L490,100 L530,100 L530,140 L550,140 L550,220 L650,220 L650,140 L670,140 L670,100 L710,100 L710,70 L730,70 L730,50 L770,50 L770,70 L790,70 L790,100 L830,100 L830,140 L850,140 L850,220 L1000,220 L1000,180 L1010,180 L1010,150 L1030,150 L1030,130 L1050,130 L1050,150 L1070,150 L1070,180 L1080,180 L1080,220 L1170,220 L1170,190 L1180,190 L1180,170 L1200,170 L1200,320 Z" />
        </svg>
      </div>

      {/* Floating Sparkle Particles */}
      <div className="sparkle-particle p1">✨</div>
      <div className="sparkle-particle p2">✨</div>

      {/* VERTICAL SINGLE-COLUMN PORTRAIT LAYOUT */}
      <div className="splash-vertical-container">
        
        {/* NOOR CARDS BRANDING */}
        <div className="splash-brand-header">
          <div className="splash-logo-frame">
            <img 
              src="/noor_arts_logo.jpg" 
              onError={(e) => { e.target.src = '/logo.jpg'; }} 
              alt="NOOR CARDS Logo" 
            />
          </div>
          <h2 className="splash-brand-title">NOOR CARDS</h2>
          <span className="splash-brand-subtitle">PREMIUM ARTS &amp; GIFTS</span>
        </div>

        {/* HEADINGS */}
        <div className="splash-campaign-wrapper">
          <div className="splash-flag-badge-icon">🇮🇳</div>
          <h1 className="splash-hero-headline">
            HAPPY<br />INDEPENDENCE DAY
          </h1>
          <p className="splash-offer-badge">SPECIAL OFFER</p>
          <h3 className="splash-coupon-title">SPECIAL COUPON CODE OFFER</h3>
        </div>

        {/* URGENCY & COUPON BOX */}
        <div className="splash-urgency-card">
          <div className="splash-limited-tag">LIMITED OFFER</div>
          <div className="splash-urgency-sub">FIRST 50 CUSTOMERS ONLY</div>
          <div className="splash-fast-text">GET YOUR COUPON CODE FAST</div>

          {/* GET THE COUPON CTA BUTTON */}
          <button 
            type="button" 
            className="splash-cta-btn"
            onClick={handleInstagramClick}
          >
            <InstagramIcon size={20} color="#FFFFFF" />
            <span>GET THE COUPON 🇮🇳</span>
          </button>

          <div className="splash-inst-text">FOLLOW OUR INSTA PAGE</div>
        </div>

        {/* BOTTOM GREETING */}
        <div className="splash-bottom-greeting">
          HAPPY 80TH INDEPENDENCE DAY 🇮🇳
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;

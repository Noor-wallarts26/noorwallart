import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import './SplashScreen.css';

// Inline Instagram SVG to guarantee 100% build compatibility without lucide-react export issues
const InstagramIcon = ({ size = 18 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
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

  // Phase states: 'logo' -> 'offer' -> 'fading' -> 'done'
  const [phase, setPhase] = useState('logo');
  const instagramUrl = 'https://instagram.com/noor.wallarts';

  // Dynamic campaign check from admin panel settings
  const isCampaignActive = storeSettings?.independenceDayCampaignActive !== false;
  const campaignEndDateStr = storeSettings?.campaignEndDate || '2026-08-31T23:59:59';
  const isExpired = new Date() > new Date(campaignEndDateStr);
  const shouldShowOffer = isCampaignActive && !isExpired;

  useEffect(() => {
    // 1. Logo Intro Animation (1.5 seconds)
    const logoTimer = setTimeout(() => {
      if (shouldShowOffer) {
        setPhase('offer');
      } else {
        // If campaign disabled or expired, fade out straight to homepage
        setPhase('fading');
      }
    }, 1500);

    return () => clearTimeout(logoTimer);
  }, [shouldShowOffer]);

  useEffect(() => {
    if (phase === 'offer') {
      // 2. Display Offer Screen for ~3 seconds then fade out to homepage
      const offerTimer = setTimeout(() => {
        setPhase('fading');
      }, 3500);

      return () => clearTimeout(offerTimer);
    }

    if (phase === 'fading') {
      // 3. Complete fade out transition (0.6 seconds)
      const fadeTimer = setTimeout(() => {
        setPhase('done');
      }, 600);

      return () => clearTimeout(fadeTimer);
    }
  }, [phase]);

  if (phase === 'done') return null;

  const handleShopNow = () => {
    setPhase('fading');
  };

  return (
    <div className={`splash-overlay ${phase}`}>
      <div className="splash-ambient-bg">
        <div className="ambient-orb orb-saffron"></div>
        <div className="ambient-orb orb-green"></div>
      </div>

      {/* PHASE 1: LOGO INTRO SCREEN */}
      {phase === 'logo' && (
        <div className="logo-intro-box animate-logo-intro">
          <div className="logo-wrapper">
            <img 
              src={storeSettings?.logoUrl || "/logo.jpg"} 
              alt="Yshift Logo" 
              className="splash-logo-img"
              onError={(e) => { e.target.src = "/logo.jpg"; }}
            />
          </div>
          <div className="brand-tagline">
            <span>NOORKARTS</span>
          </div>
        </div>
      )}

      {/* PHASE 2: INDEPENDENCE DAY OFFER SCREEN (Visible ~3s) */}
      {(phase === 'offer' || (phase === 'fading' && shouldShowOffer)) && (
        <div className="offer-intro-card animate-card-appear">
          
          <div className="tricolor-top-bar">
            <span className="bar-orange"></span>
            <span className="bar-white"></span>
            <span className="bar-green"></span>
          </div>

          <div className="offer-header">
            <div className="flag-badge">
              <span>🇮🇳</span> INDEPENDENCE DAY OFFER
            </div>
            <h2 className="celebrate-title">Celebrate Freedom. Shop Special.</h2>
          </div>

          <div className="offer-divider"></div>

          <div className="discount-section">
            <div className="launch-badge">
              <Sparkles size={14} color="#D4AF37" /> SPECIAL LAUNCH DISCOUNT
            </div>
            <p className="instagram-instruction">
              Get your exclusive discount code from our Instagram page.
            </p>
            
            <a 
              href={instagramUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="instagram-follow-btn"
            >
              <InstagramIcon size={18} />
              <span>Follow us on Instagram & get your code</span>
            </a>
          </div>

          <div className="offer-action">
            <button className="btn-shop-now" onClick={handleShopNow}>
              SHOP NOW <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default SplashScreen;

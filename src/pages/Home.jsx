import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ShoppingBag, User } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import SmartSearchBar from '../components/SmartSearchBar';
import './Home.css';

const InstagramIcon = ({ size = 22, color = 'currentColor' }) => (
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

const IndependenceDayHero = ({ storeSettings }) => {
  const rawInstagram = storeSettings?.instagram || '@noorkarts';
  const instagramUrl = rawInstagram.startsWith('http')
    ? rawInstagram
    : `https://instagram.com/${rawInstagram.replace('@', '').trim()}`;

  const handleInstagramClick = () => {
    window.open(instagramUrl, '_blank');
  };

  return (
    <div className="independence-hero-section">
      {/* Background Patriotic Glows */}
      <div className="patriotic-glow glow-saffron"></div>
      <div className="patriotic-glow glow-green"></div>

      {/* Ashoka Chakra Background Watermark */}
      <div className="chakra-watermark">
        <svg viewBox="0 0 100 100" width="300" height="300" opacity="0.035">
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

      <div className="independence-container">
        
        {/* Left Indian Flag Decoration */}
        <div className="flag-decor flag-left" title="Indian Flag 🇮🇳">
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

        {/* Center Content Column */}
        <div className="independence-main-content">
          
          {/* NOOR WALLETS Logo & Title */}
          <div className="hero-logo-wrapper">
            <img 
              src="/noor_arts_logo.jpg" 
              onError={(e) => { e.target.src = '/logo.jpg'; }} 
              alt="NOOR WALLETS Logo" 
              className="hero-logo-img"
            />
            <span className="hero-brand-title">NOOR WALLETS</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-main-title">
            INDEPENDENCE DAY 🇮🇳
          </h1>

          {/* Subtitle */}
          <p className="hero-sub-title">
            Special Independence Day Offer
          </p>

          {/* Prominent CTA Button */}
          <div className="hero-cta-wrapper">
            <button 
              onClick={handleInstagramClick}
              className="cta-get-code-btn"
            >
              <InstagramIcon size={22} color="#FFFFFF" />
              <span>GET YOUR CODE FROM INSTAGRAM</span>
            </button>
          </div>

        </div>

        {/* Right Indian Flag Decoration */}
        <div className="flag-decor flag-right" title="Indian Flag 🇮🇳">
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

const Home = () => {
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory, 
    filteredProducts, products, isProductsLoading,
    storeSettings, user
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const [avatarError, setAvatarError] = React.useState(false);

  const sliderProducts = products.filter(p => p.showInSlider).length > 0 
    ? products.filter(p => p.showInSlider)
    : products.slice(0, 10);

  return (
    <div className="home-page animate-fade-in">
      {/* PREMIUM TOP BRANDED HEADER BAR */}
      <div 
        className="top-brand-header container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.85rem 1.1rem', 
          marginTop: '0.75rem',
          marginBottom: '0.85rem',
          backgroundColor: '#E6CEC5',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 16px rgba(72, 43, 36, 0.08)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Left Side: Branded Identity (Logo + Brand Name + Subtitle) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Noor Arts & Gifts Logo Image */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#E6CEC5',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #5C3831',
            boxShadow: '0 2px 8px rgba(92, 56, 49, 0.15)',
            flexShrink: 0
          }}>
            <img 
              src="/noor_arts_logo.jpg" 
              alt="Noor Arts & Gifts Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          {/* Brand Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.3rem', 
              fontWeight: 900, 
              letterSpacing: '0.04em', 
              color: '#4A2A22',
              lineHeight: 1.15,
              fontFamily: "'Playfair Display', Georgia, serif"
            }}>
              Noor Karts
            </h1>
            <span style={{ 
              fontSize: '0.68rem', 
              fontWeight: 800, 
              color: '#6E453B', 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase',
              marginTop: '0.15rem'
            }}>
              Premium Arts & Gifts
            </span>
          </div>
        </div>

        {/* Right Side: Customer Profile Avatar Navigation Control */}
        <div 
          onClick={() => navigate(user ? '/account?tab=profile' : '/account')}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.2rem',
            WebkitTapHighlightColor: 'transparent',
            paddingLeft: '0.5rem'
          }}
          title="My Profile"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#4A2A22',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(72, 43, 36, 0.15)'
          }}>
            {user && user.photoURL && !avatarError ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                onError={() => setAvatarError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={19} color="#FFFFFF" />
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4A2A22', letterSpacing: '0.3px' }}>
            Profile
          </span>
        </div>
      </div>

      <header className="home-header">
        <div className="container">
          <SmartSearchBar placeholder="Search products, brands..." />
        </div>
      </header>
      <div className="container">

        <IndependenceDayHero storeSettings={storeSettings} />
        {sliderProducts.length > 0 && <HeroSlider products={sliderProducts} />}

        {isProductsLoading ? (
          <div className="products-loading-skeleton" style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Search size={48} color="var(--text-secondary)" />
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

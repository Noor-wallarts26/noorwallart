import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ShoppingBag, User } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import './Home.css';

const PromoBanner = ({ storeSettings }) => {
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    setVideoError(false);
  }, [storeSettings?.homepageVideoUrl]);

  return (
    <div className="promo-banner">
      {storeSettings?.homepageVideoUrl && !videoError ? (
        <video 
          key={storeSettings.homepageVideoUrl}
          src={storeSettings.homepageVideoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          onError={() => setVideoError(true)}
          className="promo-img" 
          style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <img src={storeSettings?.homepageBannerUrl || "/modern_wall_decor.png"} alt="Premium Wall Decor" className="promo-img" />
      )}
      <div className="promo-overlay"></div>
      <div className="promo-content">
        <h2 className="brand-title" style={{ color: '#ffffff' }}>NOOR KARTS</h2>
        <p style={{ color: '#ffffff' }}>PREMIUM QUALITY ARTS & GIFTS</p>
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
      <div className="top-brand-header container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0 0.5rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          {/* Customer Profile Avatar Navigation Control */}
          <div 
            onClick={() => navigate(user ? '/account?tab=profile' : '/account')}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.25rem',
              WebkitTapHighlightColor: 'transparent',
              paddingLeft: '0.25rem'
            }}
            title="My Profile"
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary, #4F46E5)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)'
            }}>
              {user && user.photoURL && !avatarError ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  onError={() => setAvatarError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <User size={20} color="#FFFFFF" />
              )}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>
              Profile
            </span>
          </div>

          {/* Brand Heading */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              Noor Karts
            </h2>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
              Premium Arts & Gifts
            </span>
          </div>
        </div>
      </div>

      <header className="home-header">
        <div className="container">
          <div className="search-bar">
            <Search size={20} className="search-icon" color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search products, brands..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={20} color="var(--text-secondary)" />
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="container">

        <PromoBanner storeSettings={storeSettings} />
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

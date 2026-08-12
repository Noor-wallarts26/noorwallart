import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import SmartSearchBar from '../components/SmartSearchBar';
import './Home.css';


const PromoBanner = ({ storeSettings }) => {
  return (
    <div className="promo-banner">
      {storeSettings?.homepageVideoUrl ? (
        <video
          src={storeSettings.homepageVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="promo-img"
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <img
          src={
            storeSettings?.homepageBannerUrl ||
            '/modern_wall_decor.png'
          }
          alt="Premium Wall Decor"
          className="promo-img"
        />
      )}

      <div className="promo-overlay"></div>

      <div className="promo-content">
        <h2 style={{ color: '#ffffff' }}>NOORKARTS</h2>
        <p style={{ color: '#ffffff' }}>
          Premium Quality Arts &amp; Gifts
        </p>
      </div>
    </div>
  );
};


const Home = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    products,
    isProductsLoading,
    storeSettings,
    user,
  } = useContext(ShopContext);

  const navigate = useNavigate();

  const [avatarError, setAvatarError] = React.useState(false);


  const sliderProducts =
    products.filter((p) => p.showInSlider).length > 0
      ? products.filter((p) => p.showInSlider)
      : products.slice(0, 10);


  return (
    <div className="home-page animate-fade-in">

      {/* =====================================================
          PREMIUM TOP BRANDED HEADER BAR
          ===================================================== */}

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
          transition: 'all 0.3s ease',
        }}
      >

        {/* LEFT SIDE - BRAND */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >

          {/* LOGO */}

          <div
            style={{
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
              flexShrink: 0,
            }}
          >
            <img
              src="/noor_arts_logo.jpg"
              alt="Noor Arts & Gifts Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>


          {/* BRAND NAME */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#4A2A22',
                lineHeight: 1.15,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              Noor Karts
            </h1>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#6E453B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '0.15rem',
              }}
            >
              Premium Arts & Gifts
            </span>
          </div>
        </div>


        {/* RIGHT SIDE - PROFILE */}

        <div
          onClick={() =>
            navigate(user ? '/account?tab=profile' : '/account')
          }
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.2rem',
            WebkitTapHighlightColor: 'transparent',
            paddingLeft: '0.5rem',
          }}
          title="My Profile"
        >

          <div
            style={{
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
              boxShadow: '0 2px 8px rgba(72, 43, 36, 0.15)',
            }}
          >
            {user && user.photoURL && !avatarError ? (
              <img
                src={user.photoURL}
                alt="Profile"
                onError={() => setAvatarError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <User size={19} color="#FFFFFF" />
            )}
          </div>

          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#4A2A22',
              letterSpacing: '0.3px',
            }}
          >
            Profile
          </span>
        </div>
      </div>


      {/* =====================================================
          SEARCH HEADER
          ===================================================== */}

      <header className="home-header">
        <div className="container">
          <SmartSearchBar
            placeholder="Search products, brands..."
          />
        </div>
      </header>


      <div className="container">

        {/* =====================================================
            PROMOTIONAL BANNER
            ===================================================== */}

        <PromoBanner
          storeSettings={storeSettings}
        />


        {/* =====================================================
            PRODUCT SLIDER
            ===================================================== */}

        {sliderProducts.length > 0 && (
          <HeroSlider
            products={sliderProducts}
          />
        )}


        {/* =====================================================
            PRODUCTS
            ===================================================== */}

        {isProductsLoading ? (

          <div
            className="products-loading-skeleton"
            style={{
              padding: '2rem 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div className="spinner"></div>
          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="empty-state">
            <Search
              size={48}
              color="var(--text-secondary)"
            />

            <p>
              No products found matching your criteria.
            </p>
          </div>

        ) : (

          /*
           * IMPORTANT:
           * The products-grid class controls the number
           * of product cards per row.
           *
           * ProductCard itself remains vertical:
           * image → title → category → rating → price.
           */

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>

        )}

      </div>
    </div>
  );
};


export default Home;



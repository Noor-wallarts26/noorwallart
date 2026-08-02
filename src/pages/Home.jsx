import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ShoppingBag } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import BannerSlider from '../components/BannerSlider';
import './Home.css';

const Home = () => {
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory, 
    filteredProducts, products, isProductsLoading,
    storeSettings
  } = useContext(ShopContext);

  const sliderProducts = products.filter(p => p.showInSlider).length > 0 
    ? products.filter(p => p.showInSlider)
    : products.slice(0, 10); // Fallback to first 10 products if none are explicitly set

  return (
    <div className="home-page animate-fade-in">
      <div className="top-brand-header container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 0 0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Link to="/store-info" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.jpg" alt="Noor Wall Arts & Gifts Logo" className="site-logo" />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.4rem' }}>NOOR WALL ARTS & GIFTS</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PREMIUM QUALITY</span>
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

        {storeSettings?.homepageVideoUrl && (
          <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <video 
              src={storeSettings.homepageVideoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'cover' }} 
            />
          </div>
        )}
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

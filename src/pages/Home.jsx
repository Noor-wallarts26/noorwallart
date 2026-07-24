import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ShoppingBag } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import './Home.css';


const PromoBanner = () => {
  return (
    <div className="promo-banner">
      <img src="/hero_banner.png" alt="Premium Wall Decor" className="promo-img" />
      <div className="promo-overlay"></div>
      <div className="promo-content">
        <h2 className="brand-title" style={{ color: '#ffffff' }}>Noor Wall Arts</h2>
        <p style={{ color: '#ffffff' }}>Premium Wall Decor <br />& Customized Gifts</p>
      </div>
    </div>
  );
};

const Home = () => {
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory, 
    filteredProducts, products 
  } = useContext(ShopContext);

  const sliderProducts = products.filter(p => p.showInSlider).length > 0 
    ? products.filter(p => p.showInSlider)
    : products.slice(0, 10); // Fallback to first 10 products if none are explicitly set


  return (
    <div className="home-page animate-fade-in">
      <div className="top-brand-header container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 0 0.5rem 0' }}>
        <div className="app-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 0 }}>
          <img src="/logo.jpg" alt="Noor Wall Arts Logo" className="site-logo" />
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.4rem' }}>NOOR WALL ARTS</h2>
        </div>
        {/* Removed top cart link as per user request */}
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

        <PromoBanner />
        {sliderProducts.length > 0 && <HeroSlider products={sliderProducts} />}

        {filteredProducts.length === 0 ? (
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

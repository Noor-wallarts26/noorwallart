import React, { useContext } from 'react';
import { Search, X, ShoppingBag } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

const categories = [
  "All", 
  "Islamic wall arts", 
  "Customized Frames", 
  "Wedding and nikkah collections", 
  "Customized Gifts", 
  "Acrylic & Glass works", 
  "Home decor", 
  "Wall stickers & Decals", 
  "Custom printing", 
  "Corporate and event products", 
  "Personalized products"
];

const PromoBanner = () => {
  return (
    <div className="promo-banner">
      <img src="/hero_banner.png" alt="Premium Wall Decor" className="promo-img" />
      <div className="promo-overlay"></div>
      <div className="promo-content">
        <span className="promo-badge">LUXURY COLLECTION</span>
        <h2>Noor Wallarts & Gifts</h2>
        <p>Premium Wall Decor & Customized Gifts</p>
        <button className="btn-primary" style={{ marginTop: '1.5rem' }}>Shop Now</button>
      </div>
    </div>
  );
};

const Home = () => {
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory, 
    filteredProducts 
  } = useContext(ShopContext);

  return (
    <div className="home-page animate-fade-in">
      <header className="home-header">
        <div className="container">
          <div className="app-logo">
            <img src="/logo.png" alt="Noor Wallarts Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <h1>Noor Wallarts & Gifts</h1>
          </div>
          
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
        <div className="category-scroll">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <PromoBanner />

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

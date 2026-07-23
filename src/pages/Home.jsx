import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
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
        <h2 className="brand-title">Noorwal Arts</h2>
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

  const ProductMarquee = ({ products }) => {
    if (!products || products.length === 0) return null;
    const marqueeItems = [...products, ...products, ...products]; // Triple for smooth infinite scroll on wide screens
    
    return (
      <div className="product-marquee-container">
        <div className="product-marquee-track">
          {marqueeItems.map((product, index) => (
            <Link to={`/product/${product.id}`} key={`${product.id}-${index}`} className="marquee-item">
              <img src={product.image} alt={product.name} />
              <div className="marquee-info">
                <span className="marquee-name">{product.name}</span>
                <span className="marquee-price">₹{product.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="home-page animate-fade-in">
      <header className="home-header">
        <div className="container">
          <div className="app-logo">
            <img src="/logo.jpg" alt="Noorwal Arts Logo" className="site-logo" />
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
      
      <ProductMarquee products={filteredProducts.slice(0, 8)} />

      <div className="container">
        <div id="categories" className="category-scroll" style={{ scrollMarginTop: '80px' }}>
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

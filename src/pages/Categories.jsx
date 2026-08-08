import React, { useContext, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import SmartSearchBar from '../components/SmartSearchBar';
import './Categories.css';

const categoriesList = [
  "All", 
  "Islamic wall arts", 
  "Customized Frames", 
  "Wedding and nikkah collections", 
  "Customized Gifts", 
  "Premium Gifts",
  "Customized Name Revealing Board",
  "Ramadan & Eid Collection",
  "Seasonal Collection",
  "Babies & Kids Toy Gifts",
  "Acrylic & Glass works", 
  "Home decor", 
  "Wall stickers & Decals", 
  "Custom printing", 
  "Corporate and event products", 
  "Personalized products",
  "Resin Arts"
];

const Categories = () => {
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory, 
    filteredProducts, isProductsLoading 
  } = useContext(ShopContext);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="categories-page animate-fade-in">
      <div className="container">
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem' }}>
          Categories
        </h2>
      </div>
      <header className="categories-header">
        <div className="container">
          
          <SmartSearchBar placeholder="Search products in categories..." />

          <div className="category-scroll-container">
            <div className="category-scroll">
              {categoriesList.map((cat, index) => (
                <button 
                  key={index}
                  className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: '100px', paddingTop: '1.5rem' }}>
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
      <Footer />
    </div>
  );
};

export default Categories;

import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, SlidersHorizontal, AlertCircle } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { products, updateProductSliderStatus } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(null); // track which product is updating

  const sliderCount = products.filter(p => p.showInSlider).length;

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSlider = async (productId, currentStatus) => {
    // If trying to add, but we already have 10, prevent it
    if (!currentStatus && sliderCount >= 10) {
      alert("You can only select up to 10 products for the slider.");
      return;
    }
    
    setIsUpdating(productId);
    await updateProductSliderStatus(productId, !currentStatus);
    setIsUpdating(null);
  };

  return (
    <div className="admin-page animate-fade-in container">
      <header className="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Manage your website content and settings</p>
      </header>

      <section className="admin-section">
        <div className="section-header">
          <div className="section-title">
            <SlidersHorizontal size={24} color="var(--primary)" />
            <h2>Hero Slider Control</h2>
          </div>
          <span className={`slider-count-badge ${sliderCount >= 10 ? 'max-reached' : ''}`}>
            {sliderCount} / 10 Selected
          </span>
        </div>
        
        <p className="section-description">
          Choose up to 10 products to display in the main sliding banner on the home page.
        </p>

        {sliderCount === 0 && (
          <div className="admin-alert">
            <AlertCircle size={18} />
            <span>Currently no products are selected. The system is showing 10 recent products as a fallback.</span>
          </div>
        )}

        <div className="admin-search">
          <Search size={20} className="search-icon" color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search products to add to slider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-product-list">
          {filteredProducts.map(product => (
            <div key={product.id} className={`admin-product-item ${product.showInSlider ? 'selected-for-slider' : ''}`}>
              <div className="product-item-info">
                <div 
                  className="product-item-image"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                >
                  {!product.imageUrl && <span style={{fontSize: '10px'}}>{product.title}</span>}
                </div>
                <div className="product-item-details">
                  <h4>{product.title}</h4>
                  <span>₹{product.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="product-item-action">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={product.showInSlider || false}
                    onChange={() => handleToggleSlider(product.id, product.showInSlider)}
                    disabled={isUpdating === product.id}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-admin-list">No products found.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Admin;

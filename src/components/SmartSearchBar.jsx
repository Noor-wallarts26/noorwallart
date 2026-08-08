import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, Tag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './SmartSearchBar.css';

const SmartSearchBar = ({ placeholder = "Search products, categories..." }) => {
  const { searchQuery, setSearchQuery, products = [] } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Debounce keystrokes (150ms delay for zero perceived lag + max efficiency)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Smart Matching & Relevance Ranking Engine
  const searchResults = useMemo(() => {
    const q = (debouncedQuery || '').trim().toLowerCase();
    if (!q) return [];

    const scoredProducts = [];

    for (const product of products) {
      if (!product) continue;

      const title = (product.title || product.name || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';

      let score = 0;

      // 1. Exact product-name match
      if (title === q) {
        score += 100;
      }
      // 2. Product name starts with typed query
      else if (title.startsWith(q)) {
        score += 80;
      }
      // 3. Any word in product name starts with typed query
      else if (title.includes(' ' + q)) {
        score += 70;
      }
      // 4. Product name contains typed query anywhere
      else if (title.includes(q)) {
        score += 60;
      }

      // 5. Category matches
      if (category === q) {
        score += 50;
      } else if (category.startsWith(q)) {
        score += 40;
      } else if (category.includes(q)) {
        score += 30;
      }

      // 6. Tags & Description match
      if (tags.includes(q)) {
        score += 25;
      } else if (description.includes(q)) {
        score += 15;
      }

      if (score > 0) {
        scoredProducts.push({ product, score });
      }
    }

    // Sort by highest relevance score
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts.map(item => item.product);
  }, [debouncedQuery, products]);

  const maxSuggestions = 5;
  const displayedResults = searchResults.slice(0, maxSuggestions);
  const totalMatchesCount = searchResults.length;

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelectProduct = (productId) => {
    setIsOpen(false);
    navigate(`/product/${productId}`);
  };

  const handleViewAllResults = () => {
    setIsOpen(false);
    // If not already on categories page, navigate there with search active
    navigate('/categories');
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="smart-search-wrapper" ref={wrapperRef}>
      <div className="search-bar">
        <Search size={20} className="search-icon" color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder={placeholder} 
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        {searchQuery && (
          <button type="button" onClick={handleClear} className="clear-search" aria-label="Clear search">
            <X size={20} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Suggestions Panel */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="search-suggestions-dropdown animate-fade-in">
          {displayedResults.length > 0 ? (
            <>
              <div className="suggestions-header">
                <span>Matching Products ({totalMatchesCount})</span>
              </div>
              <ul className="suggestions-list">
                {displayedResults.map((product) => {
                  const img = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/logo.jpg';
                  const price = Number(product.price || 0);
                  const salePrice = product.salePrice ? Number(product.salePrice) : (product.discountPrice ? Number(product.discountPrice) : null);
                  const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;

                  return (
                    <li 
                      key={product.id} 
                      className="suggestion-item"
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      <div className="suggestion-img-frame">
                        <img 
                          src={img} 
                          alt={product.title || 'Product'} 
                          onError={(e) => { e.target.src = '/logo.jpg'; }} 
                        />
                      </div>
                      
                      <div className="suggestion-details">
                        <div className="suggestion-title">{product.title || product.name}</div>
                        
                        <div className="suggestion-meta">
                          {product.category && (
                            <span className="suggestion-category">
                              <Tag size={11} /> {product.category}
                            </span>
                          )}

                          <span className={`suggestion-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                          </span>
                        </div>
                      </div>

                      <div className="suggestion-price-col">
                        {salePrice && salePrice < price ? (
                          <>
                            <span className="suggestion-sale-price">₹{salePrice.toFixed(2)}</span>
                            <span className="suggestion-old-price">₹{price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="suggestion-price">₹{price.toFixed(2)}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* View All Results Button */}
              {totalMatchesCount > maxSuggestions && (
                <div className="suggestions-footer">
                  <button 
                    type="button" 
                    className="view-all-btn"
                    onClick={handleViewAllResults}
                  >
                    <span>View All {totalMatchesCount} Results</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-suggestions-state">
              <AlertTriangle size={24} color="#94A3B8" />
              <p>No products found for "<strong>{searchQuery}</strong>"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;

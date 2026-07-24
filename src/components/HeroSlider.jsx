import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const HeroSlider = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(interval);
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="hero-slider-container">
      <div className="hero-slider-wrapper">
        {products.map((product, index) => (
          <div key={product.id} className={`hero-slide ${index === currentIndex ? 'active' : ''}`}>
            <Link to={`/product/${product.id}`} className="hero-slide-link">
              <div 
                className="hero-slide-image"
                style={{ 
                  backgroundImage: `url(${product.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!product.imageUrl && <div className="placeholder-slide">{product.title}</div>}
              </div>
              <div className="hero-slide-content">
                <h3>{product.title}</h3>
                <span className="hero-slide-price">₹{product.price.toFixed(2)}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      <div className="hero-slider-dots">
        {products.map((_, index) => (
          <button 
            key={index} 
            className={`hero-slider-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const HeroSlider = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartX = useRef(null);
  
  // Extended array for infinite loop: [last, 0, 1, 2, ..., last, 0]
  const extendedProducts = products && products.length > 0 ? [
    products[products.length - 1],
    ...products,
    products[0]
  ] : [];

  useEffect(() => {
    if (!products || products.length === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [products]);

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    // Jump instantly to real slides when reaching the cloned edges
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(products.length);
    } else if (currentIndex === extendedProducts.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const handleDotClick = (index) => {
    setIsTransitioning(true);
    setCurrentIndex(index + 1);
  };

  // The actual displayed index for the dots (0 to products.length - 1)
  const activeDotIndex = 
    currentIndex === 0 ? products.length - 1 : 
    currentIndex === extendedProducts.length - 1 ? 0 : 
    currentIndex - 1;

  return (
    <div 
      className="hero-slider-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="hero-slider-wrapper"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedProducts.map((product, index) => (
          <div key={`${product.id}-${index}`} className={`hero-slide ${index === currentIndex ? 'active' : ''}`}>
            <Link to={`/product/${product.id}`} className="hero-slide-link">
              <div className="hero-slide-content">
                <span className="hero-slide-category">{product.category}</span>
                <h3>{product.title}</h3>
                <span className="hero-slide-price">₹{product.price.toFixed(2)}</span>
                <div className="hero-buy-btn">
                  <span>Buy Now</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
              
              <div className="hero-slide-image-wrapper">
                <div 
                  className="hero-slide-image"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                >
                  {!product.imageUrl && <div className="placeholder-slide">{product.title}</div>}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      <div className="hero-slider-dots">
        {products.map((_, index) => (
          <button 
            key={index} 
            className={`hero-slider-dot ${index === activeDotIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

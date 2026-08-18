import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const HeroSlider = ({ products }) => {
  const n = products ? products.length : 0;
  
  // Real product index starts at 2 (since indices 0 and 1 are buffer clones for seamless backward swiping)
  const [currentIndex, setCurrentIndex] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartX = useRef(null);

  // Double buffer clone array to guarantee seamless multi-swipe infinite loop without glitches:
  // [P(n-2), P(n-1), P0, P1, P2, ..., P(n-1), P0, P1]
  const extendedProducts = n > 0 ? [
    products[n - 2 >= 0 ? n - 2 : 0],
    products[n - 1],
    ...products,
    products[0],
    products[1 % n]
  ] : [];

  useEffect(() => {
    if (n === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4500); // 4.5 seconds autoplay
    return () => clearInterval(interval);
  }, [n]);

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    // Jump silently without transition when reaching the cloned buffer edges
    if (currentIndex >= n + 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - n);
    } else if (currentIndex < 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + n);
    }
  };

  if (!products || n === 0) {
    return null;
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  // Calculate real product index (0 to n - 1)
  let realIndex = 0;
  if (n > 0) {
    realIndex = (currentIndex - 2 + n) % n;
  }

  // Map realIndex (0 to n - 1) to EXACTLY 3 pagination dots (0 = Start, 1 = Middle, 2 = End)
  let active3DotIndex = 0;
  if (n > 1) {
    const ratio = realIndex / (n - 1);
    if (ratio <= 0.34) {
      active3DotIndex = 0;
    } else if (ratio <= 0.67) {
      active3DotIndex = 1;
    } else {
      active3DotIndex = 2;
    }
  }

  // Clicking dot 0 (Start), 1 (Middle), or 2 (End)
  const handle3DotClick = (dotIdx) => {
    setIsTransitioning(true);
    if (dotIdx === 0) {
      setCurrentIndex(2); // First product
    } else if (dotIdx === 1) {
      setCurrentIndex(2 + Math.floor(n / 2)); // Middle product
    } else {
      setCurrentIndex(2 + n - 1); // Last product
    }
  };

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
                <div className="hero-slide-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="slider-product-img" loading="lazy" />
                  ) : (
                    <div className="placeholder-slide">{product.title}</div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* EXACTLY 3 PAGINATION DOTS CENTERED BELOW SLIDER */}
      <div className="hero-slider-dots">
        {[0, 1, 2].map((dotIdx) => (
          <button 
            key={dotIdx} 
            className={`hero-slider-dot ${dotIdx === active3DotIndex ? 'active' : ''}`}
            onClick={() => handle3DotClick(dotIdx)}
            aria-label={`Go to section ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

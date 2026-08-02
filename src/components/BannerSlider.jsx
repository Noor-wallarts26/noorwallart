import React, { useState, useEffect, useRef } from 'react';
import './BannerSlider.css';

const BannerSlider = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartX = useRef(null);

  // Extended array for infinite loop: [last, 0, 1, 2, ..., last, 0]
  const extendedBanners = banners && banners.length > 0 ? [
    banners[banners.length - 1],
    ...banners,
    banners[0]
  ] : [];

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    
    const shouldAutoSlide = banners.some(b => b.enableAutoSlider !== false);
    if (!shouldAutoSlide) return;

    const interval = setInterval(() => {
      handleNext();
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [banners]);

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
      setCurrentIndex(banners.length);
    } else if (currentIndex === extendedBanners.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  if (!banners || banners.length === 0) {
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

  // The actual displayed index for the dots (0 to banners.length - 1)
  const activeDotIndex = 
    currentIndex === 0 ? banners.length - 1 : 
    currentIndex === extendedBanners.length - 1 ? 0 : 
    currentIndex - 1;

  // If only 1 banner, don't use the sliding logic
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <div className="banner-slider-container">
        <div className="banner-slider-wrapper single">
          <div className="banner-slide active">
            {banner.link ? (
              <a href={banner.link} target={banner.link.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer">
                <img src={banner.imageURL} alt={banner.title || 'Banner'} className="banner-img" />
              </a>
            ) : (
              <img src={banner.imageURL} alt={banner.title || 'Banner'} className="banner-img" />
            )}
            {(banner.title || banner.description) && (
              <div className="banner-overlay-text">
                {banner.title && <h2>{banner.title}</h2>}
                {banner.description && <p>{banner.description}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="banner-slider-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="banner-slider-wrapper"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedBanners.map((banner, index) => (
          <div key={`${banner.id || index}-${index}`} className="banner-slide active">
            {banner.link ? (
              <a href={banner.link} target={banner.link.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer">
                <img src={banner.imageURL} alt={banner.title || 'Banner'} className="banner-img" />
              </a>
            ) : (
              <img src={banner.imageURL} alt={banner.title || 'Banner'} className="banner-img" />
            )}
            
            {(banner.title || banner.description) && (
              <div className="banner-overlay-text">
                {banner.title && <h2>{banner.title}</h2>}
                {banner.description && <p>{banner.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="banner-slider-dots">
        {banners.map((_, index) => (
          <button 
            key={index} 
            className={`banner-slider-dot ${index === activeDotIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;

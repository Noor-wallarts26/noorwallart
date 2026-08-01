import React, { useState, useEffect } from 'react';
import './BannerSlider.css';

const BannerSlider = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const shouldAutoSlide = banners.some(b => b.enableAutoSlider !== false);
    if (!shouldAutoSlide) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [banners.length, banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="banner-slider">
      {banners.map((banner, index) => (
        <div 
          key={banner.id || index}
          className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
        >
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
      
      {banners.length > 1 && (
        <div className="banner-dots">
          {banners.map((_, index) => (
            <span 
              key={index} 
              className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;

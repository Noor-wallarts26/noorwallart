import React, { useState, useEffect, useRef } from 'react';
import './BannerSlider.css';

const BannerSlider = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);
  const videoRefs = useRef({});

  // Extended array for infinite loop: [last, 0, 1, 2, ..., last, 0]
  const extendedBanners = banners && banners.length > 0 ? [
    banners[banners.length - 1],
    ...banners,
    banners[0]
  ] : [];

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Auto Slider Logic
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    
    const shouldAutoSlide = banners.some(b => b.enableAutoSlider !== false);
    if (!shouldAutoSlide) return;

    const currentBanner = extendedBanners[currentIndex];
    if (!currentBanner) return;

    // If it's a video, the onEnded event will handle the slide
    if (currentBanner.mediaType === 'video') {
      return;
    }

    // For images, set a timeout
    timerRef.current = setTimeout(() => {
      handleNext();
    }, 3500); // 3.5 seconds

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, banners]);

  // Video Playback Control
  useEffect(() => {
    Object.keys(videoRefs.current).forEach(key => {
      const video = videoRefs.current[key];
      if (video) {
        if (Number(key) === currentIndex) {
          video.play().catch(e => console.log("Video autoplay prevented:", e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex]);

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

  const renderMedia = (banner, index, isSingle = false) => {
    const isVideo = banner.mediaType === 'video';
    const mediaProps = isVideo ? {
      src: banner.imageURL,
      className: "banner-video",
      muted: true,
      playsInline: true,
      loop: isSingle, // Only loop if it's the only banner
      ref: el => videoRefs.current[index] = el,
      onEnded: () => {
        if (!isSingle && banner.enableAutoSlider !== false) {
          handleNext();
        }
      },
      onError: () => {
        if (!isSingle && banner.enableAutoSlider !== false) {
          handleNext();
        }
      }
    } : {
      src: banner.imageURL,
      alt: banner.title || 'Banner',
      className: "banner-img"
    };

    const mediaElement = isVideo ? <video {...mediaProps} /> : <img {...mediaProps} />;

    if (banner.link) {
      return (
        <a href={banner.link} target={banner.link.startsWith('http') ? "_blank" : "_self"} rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
          {mediaElement}
        </a>
      );
    }
    return mediaElement;
  };

  // If only 1 banner, don't use the sliding logic
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <div className="banner-slider-container">
        <div className="banner-slider-wrapper single">
          <div className="banner-slide active">
            {renderMedia(banner, 1, true)}
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
            
            {renderMedia(banner, index)}
            
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

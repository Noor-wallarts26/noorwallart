import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Zap, ShoppingCart, Share2 } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const categoryStyles = {
  Electronics: { color: '#3B82F6', icon: '💻' },
  Fashion: { color: '#EC4899', icon: '👕' },
  Books: { color: '#F59E0B', icon: '📚' },
  Home: { color: '#10B981', icon: '🏠' },
  Beauty: { color: '#8B5CF6', icon: '✨' },
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, toggleWishlist, addToCart, addReview } = useContext(ShopContext);
  
  const product = products.find(p => String(p.id) === String(id));

  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    
    setIsSubmittingReview(true);
    const success = await addReview(product.id, reviewForm);
    if (success) {
      setReviewForm({ name: '', rating: 5, comment: '' });
    }
    setIsSubmittingReview(false);
  };

  // Scroll to top and reset state on load or when product id changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setReviewForm({ name: '', rating: 5, comment: '' });
  }, [id]);

  if (!product) {
    return (
      <div className="empty-state">
        <p>Product not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Return to Shop</button>
      </div>
    );
  }

  const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} for ₹${product.price.toFixed(2)} on Noor Wall Arts!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const handleBuyNow = () => {
    addToCart(product.id);
    navigate('/cart');
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { text: "Currently Out of Stock", color: "#DC2626" }; // Red
    if (product.stock <= 5) return { text: `Only ${product.stock} left in stock - order soon`, color: "#F59E0B" }; // Yellow/Orange
    return { text: `In Stock (${product.stock} items available)`, color: "#16A34A" }; // Green
  };

  const stockStatus = getStockStatus();

  // Get related products (same category, not this exact product)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div key={id} className="product-detail-page animate-fade-in" style={{ position: 'relative' }}>
        <header style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} className="back-btn" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', cursor: 'pointer' }}>
            <ArrowLeft size={22} color="#333" />
          </button>
        </header>

      <div className="detail-image-area" style={{ height: '35vh', minHeight: '300px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }} 
            onClick={() => setIsFullscreen(true)}
          />
        ) : (
          <div className="detail-category-icon" style={{ color, fontSize: '4rem' }}>{icon}</div>
        )}
      </div>

      {isFullscreen && createPortal(
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: '#000000', zIndex: 9999999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            overflow: 'hidden',
            touchAction: 'none'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            style={{ 
              position: 'absolute', top: '1.5rem', right: '1.5rem', 
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', 
              borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              zIndex: 10000000
            }}
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          >
            &times;
          </button>
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}

      <div className="detail-content container" style={{ paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h1 className="detail-title" style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            lineHeight: '1.35', 
            margin: 0
          }}>{product.title}</h1>
        </div>

        <div className="detail-rating" style={{ marginBottom: '1.25rem' }}>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={14} 
                fill={star <= Math.round(product.rating) ? '#F59E0B' : 'none'} 
                color={star <= Math.round(product.rating) ? '#F59E0B' : '#94A3B8'} 
              />
            ))}
          </div>
          <span className="detail-reviews" style={{ fontSize: '0.9rem', color: '#3B82F6', fontWeight: '500' }}>{product.reviewsCount} ratings</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="detail-price" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: 0, color: 'var(--text-primary)', lineHeight: 1 }}>₹{product.price.toFixed(2)}</div>
          <div style={{ 
            color: product.stock === 0 ? '#DC2626' : '#16A34A', 
            fontSize: '0.85rem', 
            fontWeight: '500', 
            marginBottom: '0.15rem'
          }}>
            {product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} Items Available)`}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 0',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Charge</span>
            <strong>₹{product.deliveryCharge !== undefined ? Number(product.deliveryCharge).toFixed(2) : '80.00'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => toggleWishlist(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
              <Heart size={22} fill={product.isWishlisted ? '#EF4444' : 'none'} color={product.isWishlisted ? '#EF4444' : 'var(--text-secondary)'} />
            </button>
            <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
              <Share2 size={22} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div className="detail-description-box">
          <h3>Product Description</h3>
          <p>{product.description}</p>
        </div>

        <div className="detail-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '2.5rem' }}>
          <button 
            onClick={() => {
              addToCart(product.id);
              navigate('/');
            }}
            disabled={product.stock === 0}
            style={{ 
              flex: 1, 
              padding: '0.85rem', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '1rem',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
              opacity: product.stock === 0 ? 0.5 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>

          <button 
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            style={{ 
              flex: 1, 
              padding: '0.85rem', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '1rem',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              opacity: product.stock === 0 ? 0.5 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(var(--primary-rgb), 0.3)'
            }}
          >
            <Zap size={18} fill="currentColor" />
            Buy Now
          </button>
        </div>

        <div className="product-reviews-section mt-4">
          <hr className="detail-divider" />
          <h3 style={{ marginBottom: '1.5rem' }}>Customer Reviews</h3>
          
          <div className="write-review-card">
            <h4>Write a Review</h4>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={reviewForm.name}
                  onChange={e => setReviewForm({...reviewForm, name: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ margin: '1rem 0' }}>
                <label>Rating: </label>
                <select 
                  value={reviewForm.rating} 
                  onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                  style={{ padding: '0.5rem', borderRadius: '4px' }}
                >
                  {[5,4,3,2,1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <textarea 
                  placeholder="Share your experience with this product..." 
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  required
                  rows={3}
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn-primary mt-3" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          <div className="reviews-list mt-4">
            {(!product.reviews || product.reviews.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to review this product!</p>
            ) : (
              product.reviews.sort((a, b) => b.timestamp - a.timestamp).map((review) => (
                <div key={review.id} className="review-item card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{review.name}</strong>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={12} 
                          fill={star <= review.rating ? '#F59E0B' : 'none'} 
                          color={star <= review.rating ? '#F59E0B' : '#94A3B8'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{review.comment}</p>
                  <small style={{ color: '#94A3B8', display: 'block', marginTop: '0.5rem' }}>
                    {new Date(review.timestamp).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-products-section mt-4">
            <h3 style={{ marginBottom: '1rem' }}>You might also like</h3>
            <div className="product-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
              gap: '1rem' 
            }}>
              {relatedProducts.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

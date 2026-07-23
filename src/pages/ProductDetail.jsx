import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Flashlight, ShoppingCart } from 'lucide-react';
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
  
  const product = products.find(p => p.id === parseInt(id));

  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="empty-state">
        <p>Product not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Return to Shop</button>
      </div>
    );
  }

  const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };

  const handleBuyNow = () => {
    addToCart(product.id);
    navigate('/cart');
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { text: "Currently Out of Stock", color: "var(--error)" };
    if (product.stock <= 5) return { text: `Only ${product.stock} left in stock - order soon`, color: "#F59E0B" };
    return { text: `In Stock (${product.stock} items available)`, color: "var(--success)" };
  };

  const stockStatus = getStockStatus();

  // Get related products (same category, not this exact product)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="product-detail-page animate-fade-in">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={24} />
        </button>
        <h2>Product Details</h2>
        <button onClick={() => toggleWishlist(product.id)} className="detail-wishlist-btn">
          <Heart size={24} fill={product.isWishlisted ? '#EF4444' : 'none'} color={product.isWishlisted ? '#EF4444' : 'var(--text-primary)'} />
        </button>
      </header>

      <div 
        className="detail-image-area" 
        style={product.imageUrl ? { 
          backgroundImage: `url(${product.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '300px'
        } : { 
          background: `linear-gradient(to bottom, ${color}33, transparent)`,
          height: '250px'
        }}
      >
        {!product.imageUrl && <div className="detail-category-icon" style={{ color }}>{icon}</div>}
      </div>

      <div className="detail-content container">
        <div className="detail-category-badge" style={{ backgroundColor: `${color}22`, color }}>
          {product.category.toUpperCase()}
        </div>

        <h1 className="detail-title">{product.title}</h1>

        <div className="detail-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={16} 
                fill={star <= Math.round(product.rating) ? '#F59E0B' : 'none'} 
                color={star <= Math.round(product.rating) ? '#F59E0B' : '#94A3B8'} 
              />
            ))}
          </div>
          <span className="detail-reviews">{product.rating} ({product.reviewsCount} verified customer ratings)</span>
        </div>

        <hr className="detail-divider" />

        <div className="detail-price">₹{product.price.toFixed(2)}</div>
        <div className="detail-stock" style={{ color: stockStatus.color }}>{stockStatus.text}</div>

        <div className="detail-description-box">
          <h3>Product Description</h3>
          <p>{product.description}</p>
        </div>

        <div className="detail-actions">
          <button 
            className="btn-tertiary full-width-btn" 
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            style={{ opacity: product.stock === 0 ? 0.5 : 1 }}
          >
            <Flashlight size={20} />
            Buy Now
          </button>

          <button 
            className="btn-outline full-width-btn" 
            onClick={() => {
              addToCart(product.id);
              navigate('/');
            }}
            disabled={product.stock === 0}
            style={{ opacity: product.stock === 0 ? 0.5 : 1 }}
          >
            <ShoppingCart size={20} />
            Add to Shopping Cart
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

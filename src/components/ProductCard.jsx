import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './ProductCard.css';

// Simple map for icons/colors based on category
const categoryStyles = {
  Electronics: { color: '#3B82F6', icon: '💻' },
  Fashion: { color: '#EC4899', icon: '👕' },
  Books: { color: '#F59E0B', icon: '📚' },
  Home: { color: '#10B981', icon: '🏠' },
  Beauty: { color: '#8B5CF6', icon: '✨' },
};

const ProductCard = ({ product }) => {
  const { toggleWishlist, addToCart } = useContext(ShopContext);
  const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };

  return (
    <div className="product-card card">
      <Link 
        to={`/product/${product.id}`} 
        className="product-image-area" 
        style={product.imageUrl ? { 
          backgroundImage: `url(${product.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : { 
          background: `linear-gradient(to bottom, ${color}22, transparent)` 
        }}
      >
        {!product.imageUrl && <div className="category-icon" style={{ color }}>{icon}</div>}
        
        {product.stock === 0 && (
          <div className="out-of-stock-badge">OUT OF STOCK</div>
        )}
      </Link>
      
      <button 
        className="wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
      >
        <Heart 
          size={20} 
          fill={product.isWishlisted ? '#EF4444' : 'none'} 
          color={product.isWishlisted ? '#EF4444' : 'var(--text-secondary)'} 
        />
      </button>

      <div className="product-info">
        <Link to={`/product/${product.id}`}>
          <h3 className="product-title" title={product.title}>{product.title}</h3>
        </Link>
        <span className="product-category">{product.category}</span>
        
        <div className="product-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={12} 
                fill={star <= Math.round(product.rating) ? '#F59E0B' : 'none'} 
                color={star <= Math.round(product.rating) ? '#F59E0B' : '#94A3B8'} 
              />
            ))}
          </div>
          <span className="reviews-count">({product.reviewsCount})</span>
        </div>

        <div className="product-bottom">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button 
            className="add-to-cart-btn"
            disabled={product.stock === 0}
            onClick={() => addToCart(product.id)}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

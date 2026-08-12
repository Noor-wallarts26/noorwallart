import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './ProductCard.css';

const categoryStyles = {
  "Islamic wall arts": { color: '#10B981', icon: '☪️' },
  "Customized Frames": { color: '#3B82F6', icon: '🖼️' },
  "Wedding and nikkah collections": { color: '#EC4899', icon: '💍' },
  "Customized Gifts": { color: '#F59E0B', icon: '🎁' },
  "Acrylic & Glass works": { color: '#8B5CF6', icon: '✨' },
  "Home decor": { color: '#14B8A6', icon: '🏠' },
  "Wall stickers & Decals": { color: '#F43F5E', icon: '🎨' },
  "Custom printing": { color: '#6366F1', icon: '🖨️' },
  "Corporate and event products": { color: '#0F766E', icon: '🏢' },
  "Personalized products": { color: '#D946EF', icon: '💝' },
};

const ProductCard = ({ product }) => {
  const { toggleWishlist, addToCart } = useContext(ShopContext);

  const { color, icon } =
    categoryStyles[product.category] || {
      color: '#94A3B8',
      icon: '📦',
    };

  // Support multiple images, falling back to imageUrl
  const displayImage =
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    product.images[0]
      ? product.images[0]
      : product.imageUrl;

  const currentPrice = parseFloat(
    product.price || product.offerPrice || 0
  );

  const regularPrice = parseFloat(
    product.regularPrice || 0
  );

  const hasDiscount = regularPrice > currentPrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((regularPrice - currentPrice) / regularPrice) * 100
      )
    : 0;

  return (
    <div className="product-card card">

      {/* PRODUCT IMAGE */}
      <Link
        to={`/product/${product.id}`}
        className="product-image-area"
        style={
          displayImage
            ? {
                backgroundImage: `url(${displayImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background: 'var(--surface-variant)',
              }
        }
      >
        {!displayImage && (
          <div
            className="category-icon"
            style={{ color }}
          >
            {icon}
          </div>
        )}

        {product.stock === 0 && (
          <div className="out-of-stock-badge">
            OUT OF STOCK
          </div>
        )}

        {hasDiscount && discountPercent > 0 && (
          <div className="discount-badge">
            {discountPercent}% OFF
          </div>
        )}
      </Link>

      {/* WISHLIST */}
      <button
        className="wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        title={
          product.isWishlisted
            ? 'Remove from wishlist'
            : 'Add to wishlist'
        }
      >
        <Heart
          size={20}
          fill={
            product.isWishlisted
              ? '#EF4444'
              : 'none'
          }
          color={
            product.isWishlisted
              ? '#EF4444'
              : 'var(--text-secondary)'
          }
        />
      </button>

      {/* PRODUCT INFORMATION */}
      <div className="product-info">

        <Link to={`/product/${product.id}`}>
          <h3
            className="product-title"
            title={product.title}
          >
            {product.title}
          </h3>
        </Link>

        <span className="product-category">
          {product.category}
        </span>

        {/* RATING */}
        <div className="product-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                fill={
                  star <=
                  Math.round(product.rating || 5)
                    ? '#F59E0B'
                    : 'none'
                }
                color={
                  star <=
                  Math.round(product.rating || 5)
                    ? '#F59E0B'
                    : '#94A3B8'
                }
              />
            ))}
          </div>

          <span className="reviews-count">
            ({product.reviewsCount || 0})
          </span>
        </div>

        {/* PRICE + CART */}
        <div className="product-bottom">

          <Link to={`/product/${product.id}`}>
            <div className="price-container">

              <span className="product-price">
                ₹{currentPrice.toFixed(2)}
              </span>

              {hasDiscount && (
                <span className="product-regular-price">
                  ₹{regularPrice.toFixed(2)}
                </span>
              )}

            </div>
          </Link>

          <button
            className="add-to-cart-btn"
            disabled={product.stock === 0}
            onClick={() =>
              addToCart(product.id)
            }
            title={
              product.stock === 0
                ? 'Out of stock'
                : 'Add to cart'
            }
          >
            <ShoppingCart size={16} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;

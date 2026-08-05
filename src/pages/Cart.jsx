import React, { useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Tag } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Cart.css';

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

const Cart = () => {
  const {
    cartWithProducts, cartTotal, deliveryFee, totalItemsInCart,
    updateCartQuantity, removeFromCart, user, finalTotal
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const location = useLocation();

  const handleCheckoutClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location, message: 'Login with your phone number to order now' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="cart-page animate-fade-in">
      <header className="cart-header container">
        <h2>Shopping Cart</h2>
        <span className="cart-item-count">{totalItemsInCart} Items</span>
      </header>

      <div className="container">
        {cartWithProducts.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} color="var(--text-secondary)" />
            <p>Your Shopping Cart is empty. Explore and add some incredible products!</p>
            <button className="btn-primary mt-4" onClick={() => navigate('/')}>Explore Shop</button>
          </div>
        ) : (
          <div className="cart-content">
            {/* CART ITEMS */}
            <div className="cart-items-list">
              {cartWithProducts.map(({ product, quantity, unitPrice, discountedUnitPrice, discountAmountPerUnit, appliedCoupon }) => {
                const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };
                const hasDiscount = discountAmountPerUnit > 0;

                return (
                  <div key={product.id} className="cart-item card">
                    <div
                      className="cart-item-image"
                      style={{
                        backgroundColor: `${color}11`,
                        backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!product.imageUrl && <span style={{ fontSize: '2rem', color }}>{icon}</span>}
                    </div>

                    <div className="cart-item-details">
                      <Link to={`/product/${product.id}`}>
                        <h3 title={product.title}>{product.title}</h3>
                      </Link>
                      <span className="cart-item-category">{product.category}</span>
                      
                      {/* PER-ITEM PRICE DISPLAY */}
                      <div className="cart-item-price" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {hasDiscount ? (
                          <>
                            <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '1.1rem' }}>
                              ₹{discountedUnitPrice.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                              ₹{unitPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 700 }}>₹{unitPrice.toFixed(2)}</span>
                        )}
                      </div>

                      {/* APPLIED COUPON BADGE */}
                      {appliedCoupon && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          marginTop: '0.4rem', padding: '0.2rem 0.55rem', borderRadius: '12px',
                          backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0',
                          fontSize: '0.75rem', fontWeight: 600, color: '#15803D'
                        }}>
                          <Tag size={12} color="#16A34A" />
                          <span>Coupon '{appliedCoupon.code}' (-₹{discountAmountPerUnit.toFixed(2)})</span>
                        </div>
                      )}
                    </div>

                    <div className="cart-item-actions">
                      <button className="remove-btn" onClick={() => removeFromCart(product.id)}>
                        <Trash2 size={18} />
                      </button>
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateCartQuantity(product.id, quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{quantity}</span>
                        <button
                          className="qty-btn"
                          disabled={quantity >= product.stock}
                          onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ORDER SUMMARY */}
            <div className="cart-summary card">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal ({totalItemsInCart} items)</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <span>
                  Shipping
                  <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)' }}>
                    (Based on selected products)
                  </span>
                </span>
                <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>

              <hr className="detail-divider" style={{ margin: '1rem 0' }} />

              <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }}
                onClick={handleCheckoutClick}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

import React, { useContext, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Tag, X, CheckCircle } from 'lucide-react';
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
    updateCartQuantity, removeFromCart, user,
    appliedCoupon, couponDiscount, finalTotal, applyCoupon, removeCoupon
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const location = useLocation();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', isError: false });
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMsg({ text: 'Please enter a coupon code.', isError: true });
      return;
    }
    setCouponLoading(true);
    setCouponMsg({ text: '', isError: false });
    const result = await applyCoupon(couponCode);
    setCouponLoading(false);
    if (result.success) {
      setCouponMsg({ text: result.message, isError: false });
      setCouponCode('');
    } else {
      setCouponMsg({ text: result.error, isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMsg({ text: '', isError: false });
    setCouponCode('');
  };

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
              {cartWithProducts.map(({ product, quantity }) => {
                const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };
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
                      <div className="cart-item-price">₹{product.price.toFixed(2)}</div>
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
              <div className="cart-summary-row">
                <span>
                  Shipping
                  <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)' }}>
                    (Based on selected products)
                  </span>
                </span>
                <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>

              {/* ── COUPON SECTION ── */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Tag size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Apply Coupon</span>
                </div>

                {appliedCoupon ? (
                  /* Coupon applied – show badge */
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', backgroundColor: '#DCFCE7',
                    border: '1px solid #BBF7D0', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} color="#16A34A" />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534' }}>{appliedCoupon.code}</span>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803D' }}>
                          {appliedCoupon.discountType === 'percentage'
                            ? `${appliedCoupon.discountValue}% OFF`
                            : `₹${appliedCoupon.discountValue} OFF`} Applied!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      title="Remove coupon"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  /* Coupon input */
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      style={{
                        flex: 1, padding: '0.6rem 0.75rem',
                        borderRadius: '8px', border: '1px solid var(--border-color)',
                        fontSize: '0.875rem', letterSpacing: '0.05em'
                      }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '8px',
                        backgroundColor: 'var(--primary)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap'
                      }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {couponMsg.text && (
                  <p style={{
                    margin: '0.5rem 0 0 0', fontSize: '0.8rem',
                    color: couponMsg.isError ? '#DC2626' : '#16A34A', fontWeight: 500
                  }}>
                    {couponMsg.isError ? '⚠️ ' : '✅ '}{couponMsg.text}
                  </p>
                )}
              </div>

              <hr className="detail-divider" style={{ margin: '1rem 0' }} />

              {couponDiscount > 0 && (
                <div className="summary-row" style={{ color: '#16A34A', fontWeight: 600 }}>
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{(finalTotal ?? (cartTotal + deliveryFee)).toFixed(2)}</span>
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

import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Cart.css';

const categoryStyles = {
  Electronics: { color: '#3B82F6', icon: '💻' },
  Fashion: { color: '#EC4899', icon: '👕' },
  Books: { color: '#F59E0B', icon: '📚' },
  Home: { color: '#10B981', icon: '🏠' },
  Beauty: { color: '#8B5CF6', icon: '✨' },
};

const Cart = () => {
  const { cartWithProducts, cartTotal, updateCartQuantity, removeFromCart, totalItemsInCart } = useContext(ShopContext);
  const navigate = useNavigate();

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
            <div className="cart-items-list">
              {cartWithProducts.map(({ product, quantity }) => {
                const { color, icon } = categoryStyles[product.category] || { color: '#94A3B8', icon: '📦' };
                
                return (
                  <div key={product.id} className="cart-item card">
                    <div className="cart-item-image" style={{ backgroundColor: `${color}11` }}>
                      <span style={{ fontSize: '2rem', color }}>{icon}</span>
                    </div>
                    
                    <div className="cart-item-details">
                      <Link to={`/product/${product.id}`}><h3 title={product.title}>{product.title}</h3></Link>
                      <span className="cart-item-category">{product.category}</span>
                      <div className="cart-item-price">${product.price.toFixed(2)}</div>
                    </div>

                    <div className="cart-item-actions">
                      <button className="remove-btn" onClick={() => removeFromCart(product.id)}>
                        <Trash2 size={18} />
                      </button>
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn" 
                          onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        >
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

            <div className="cart-summary card">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({totalItemsInCart} items)</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{cartTotal > 50 ? 'Free' : '$5.99'}</span>
              </div>
              <div className="summary-row">
                <span>Tax (Estimated)</span>
                <span>${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <hr className="detail-divider" />
              <div className="summary-row total">
                <span>Total</span>
                <span>${(cartTotal + (cartTotal > 50 ? 0 : 5.99) + (cartTotal * 0.08)).toFixed(2)}</span>
              </div>
              
              <button 
                className="btn-tertiary checkout-btn" 
                onClick={() => navigate('/checkout')}
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

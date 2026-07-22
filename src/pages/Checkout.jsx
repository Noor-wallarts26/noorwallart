import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Lock } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Checkout.css';

const Checkout = () => {
  const { cartTotal, totalItemsInCart, placeOrder } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: 'John Doe',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    phone: '+1 (650) 253-0000',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/24',
    cvc: '123'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const [orderPlaced, setOrderPlaced] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    // Simulate Stripe API delay
    setTimeout(() => {
      const order = placeOrder();
      setIsProcessing(false);
      if (order) {
        setOrderPlaced(order);
      }
    }, 2000);
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page confirm-state animate-fade-in">
        <div className="container">
          <div className="order-success-card card">
            <CheckCircle2 size={64} color="var(--success)" className="success-icon" />
            <h2>Order Placed Successfully!</h2>
            <p className="order-id">Order ID: <strong>{orderPlaced.id}</strong></p>
            <p className="order-msg">Thank you for shopping with AmazeShop. Your order is being processed and will be shipped soon.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  const finalTotal = cartTotal + (cartTotal > 50 ? 0 : 5.99) + (cartTotal * 0.08);

  return (
    <div className="checkout-page animate-fade-in">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={24} />
        </button>
        <h2>Checkout</h2>
        <div style={{ width: 40 }}></div>
      </header>

      <div className="container checkout-content">
        <div className="checkout-form card">
          <h3>Shipping Information</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Delivery Address</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3"></textarea>
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>

          <h3 className="mt-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--success)" /> Secure Payment
          </h3>
          <div className="stripe-mock-container">
            <div className="stripe-card-header">
              <span>Pay with Card</span>
              <div className="card-icons">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="form-group stripe-input-group">
              <label>Card Number</label>
              <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="0000 0000 0000 0000" />
            </div>
            <div className="stripe-row">
              <div className="form-group stripe-input-group">
                <label>Expiration</label>
                <input type="text" name="expiry" value={formData.expiry} onChange={handleInputChange} placeholder="MM/YY" />
              </div>
              <div className="form-group stripe-input-group">
                <label>CVC</label>
                <input type="text" name="cvc" value={formData.cvc} onChange={handleInputChange} placeholder="123" />
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-summary card">
          <h3>Order Total</h3>
          <div className="summary-row">
            <span>Items ({totalItemsInCart})</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{cartTotal > 50 ? 'Free' : '$5.99'}</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>${(cartTotal * 0.08).toFixed(2)}</span>
          </div>
          <hr className="detail-divider" />
          <div className="summary-row total">
            <span>Total Payable</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>

          <button className="btn-tertiary checkout-btn" onClick={handleCheckout} disabled={isProcessing}>
            {isProcessing ? 'Processing Payment...' : `Pay $${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

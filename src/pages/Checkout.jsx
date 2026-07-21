import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Checkout.css';

const Checkout = () => {
  const { cartTotal, totalItemsInCart, placeOrder } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: 'John Doe',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    phone: '+1 (650) 253-0000',
    paymentMethod: 'Credit Card (*4321)'
  });

  const [orderPlaced, setOrderPlaced] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = () => {
    const order = placeOrder();
    if (order) {
      setOrderPlaced(order);
    }
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

          <h3 className="mt-4">Payment Method</h3>
          <div className="form-group">
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
              <option value="Credit Card (*4321)">Credit Card (*4321)</option>
              <option value="PayPal">PayPal</option>
              <option value="Apple Pay">Apple Pay</option>
              <option value="Google Pay">Google Pay</option>
            </select>
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

          <button className="btn-tertiary checkout-btn" onClick={handleCheckout}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

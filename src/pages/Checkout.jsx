import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Lock } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import './Checkout.css';

const Checkout = () => {
  const { cartTotal, totalItemsInCart, placeOrder, user, loading } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    houseNo: '',
    building: '',
    street: '',
    area: '',
    landmark: '',
    district: '',
    state: '',
    pincode: '',
    addressType: 'Home',
    instructions: '',
    upiRef: '',
    lat: null,
    lng: null
  });

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.houseNo.trim() !== '' &&
      formData.street.trim() !== '' &&
      formData.area.trim() !== '' &&
      formData.district.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.pincode.trim() !== '' &&
      formData.upiRef.trim() !== ''
    );
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { state: { from: location.pathname, message: 'Please login to checkout' }, replace: true });
      } else {
        setFormData(prev => ({ ...prev, phone: user.phoneNumber || '' }));
      }
    }
  }, [user, loading, navigate, location]);

  if (loading || !user) {
    return <div className="checkout-page animate-fade-in"><div className="container" style={{padding: '2rem'}}>Loading...</div></div>;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    const order = await placeOrder(formData);
    setIsProcessing(false);
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
            <p className="order-msg">Thank you for shopping with Noor Wall Arts. Your order is being processed and will be shipped soon.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  const finalTotal = cartTotal + 80;

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

          <MapPicker 
            onLocationSelect={(loc) => {
              setFormData(prev => ({
                ...prev,
                lat: loc.lat,
                lng: loc.lng,
                // Optional: auto-fill some fields if reverse geocoding provides them
              }));
            }} 
          />

          <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Phone Number *</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" required />
            </div>
            
            <div className="form-group">
              <label>House / Flat / Door No. *</label>
              <input type="text" name="houseNo" value={formData.houseNo} onChange={handleInputChange} placeholder="e.g. Flat 4B" required />
            </div>
            
            <div className="form-group">
              <label>Building / Apartment Name (Optional)</label>
              <input type="text" name="building" value={formData.building} onChange={handleInputChange} placeholder="e.g. Sea View Apts" />
            </div>

            <div className="form-group">
              <label>Street / Road Name *</label>
              <input type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="e.g. MG Road" required />
            </div>

            <div className="form-group">
              <label>Area / Locality *</label>
              <input type="text" name="area" value={formData.area} onChange={handleInputChange} placeholder="e.g. Anna Nagar" required />
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="e.g. Opposite Post Office" />
            </div>

            <div className="form-group">
              <label>District *</label>
              <input type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="e.g. Chennai" required />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="e.g. Tamil Nadu" required />
            </div>

            <div className="form-group">
              <label>Pincode *</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="e.g. 600001" required />
            </div>
            
            <div className="form-group">
              <label>Address Type *</label>
              <select name="addressType" value={formData.addressType} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
                <option value="Home">Home (All day delivery)</option>
                <option value="Office">Office (Delivery between 10 AM - 5 PM)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Delivery Instructions (Optional)</label>
            <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} rows="2" placeholder="Describe your delivery instructions (e.g. Leave at security)"></textarea>
          </div>

          <h3 className="mt-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--success)" /> UPI Payment
          </h3>
          <div className="stripe-mock-container" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Scan the QR Code to pay <strong>₹{finalTotal.toFixed(2)}</strong> via any UPI App.
            </p>
            <div style={{ background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=arahman32773-4@okicici&pn=Noor_Wallarts_Gifts&am=${finalTotal.toFixed(2)}&cu=INR`)}`} 
                alt="UPI QR Code" 
                style={{ width: '200px', height: '200px' }} 
              />
            </div>
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>UPI ID: arahman32773-4@okicici</p>
            
            <div className="form-group stripe-input-group" style={{ marginTop: '2rem', textAlign: 'left' }}>
              <label>UPI Transaction Reference Number</label>
              <input 
                type="text" 
                name="upiRef" 
                value={formData.upiRef} 
                onChange={handleInputChange} 
                placeholder="Enter 12-digit UPI reference number" 
                required
              />
            </div>
          </div>
        </div>

        <div className="checkout-summary card">
          <h3>Order Total</h3>
          <div className="summary-row">
            <span>Items ({totalItemsInCart})</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>₹80.00</span>
          </div>
          <hr className="detail-divider" />
          <div className="summary-row total">
            <span>Total Payable</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>

          <button 
            className="btn-primary checkout-btn" 
            onClick={handleCheckout} 
            disabled={isProcessing || !isFormValid()}
          >
            {isProcessing ? 'Processing Order...' : `Complete Order (₹${finalTotal.toFixed(2)})`}
          </button>
          {!isFormValid() && (
            <p style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
              Please fill all mandatory (*) fields to complete your order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

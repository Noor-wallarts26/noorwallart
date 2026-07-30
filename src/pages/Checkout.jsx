import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Lock, Wallet, MessageCircle } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import indiaData from '../utils/indiaStatesDistricts.json';
import './Checkout.css';

const Checkout = () => {
  const { cartTotal, deliveryFee, totalItemsInCart, placeOrder, user, loading, deliveryAddress } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  const [formData, setFormData] = useState({
    name: deliveryAddress?.name || '',
    phone: deliveryAddress?.phone || '',
    houseNo: deliveryAddress?.houseNo || '',
    building: deliveryAddress?.building || '',
    street: deliveryAddress?.street || '',
    area: deliveryAddress?.area || '',
    landmark: deliveryAddress?.landmark || '',
    district: deliveryAddress?.district || '',
    state: deliveryAddress?.state || '',
    country: deliveryAddress?.country || 'India',
    pincode: deliveryAddress?.pincode || '',
    addressType: deliveryAddress?.addressType || 'Home',
    instructions: deliveryAddress?.instructions || '',
    upiRef: '',
    lat: deliveryAddress?.lat || null,
    lng: deliveryAddress?.lng || null
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
      (paymentMethod !== 'UPI' || formData.upiRef.trim() !== '')
    );
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const statesList = React.useMemo(() => {
    return indiaData.states.map(s => s.state).sort((a, b) => a.localeCompare(b));
  }, []);

  const districtsList = React.useMemo(() => {
    const selectedStateObj = indiaData.states.find(s => s.state === formData.state);
    if (selectedStateObj) {
      return [...selectedStateObj.districts].sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [formData.state]);

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, state: e.target.value, district: '' }));
  };

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);

    if (paymentMethod === 'Online') {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        setIsProcessing(false);
        return;
      }
      
      try {
        const orderRes = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal })
        });
        
        const orderData = await orderRes.json();
        
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');
        
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Noor Wall Arts",
          description: "Purchase Payment",
          order_id: orderData.id,
          handler: async function (response) {
            try {
              setIsProcessing(true);
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
              });
              
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                const finalOrder = await placeOrder(formData, 'Online', { transactionId: response.razorpay_payment_id });
                if (finalOrder) setOrderPlaced(finalOrder);
              } else {
                alert("Payment verification failed! If money was deducted, it will be refunded.");
              }
              setIsProcessing(false);
            } catch (err) {
              alert("Error verifying payment.");
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
          },
          theme: {
            color: "#d4af37"
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert("Payment Failed: " + response.error.description);
          setIsProcessing(false);
        });
        rzp.open();
      } catch (err) {
        console.error("Payment error:", err);
        alert(err.message || "Something went wrong with the payment system.");
        setIsProcessing(false);
      }
    } else if (paymentMethod === 'UPI') {
      const order = await placeOrder(formData, 'UPI');
      setIsProcessing(false);
      if (order) {
        setOrderPlaced(order);
      }
    } else {
      const order = await placeOrder(formData, 'COD');
      setIsProcessing(false);
      if (order) {
        setOrderPlaced(order);
      }
    }
  };

  const handleWhatsAppOrder = () => {
    if (!orderPlaced) return;
    
    const addressDetails = [
      orderPlaced.customer.houseNo,
      orderPlaced.customer.building,
      orderPlaced.customer.street,
      orderPlaced.customer.area,
      orderPlaced.customer.landmark,
      orderPlaced.customer.district,
      orderPlaced.customer.state,
      orderPlaced.customer.pincode
    ].filter(Boolean).join(', ');

    const mapLink = orderPlaced.customer.lat && orderPlaced.customer.lng 
      ? `https://www.google.com/maps/search/?api=1&query=${orderPlaced.customer.lat},${orderPlaced.customer.lng}` 
      : 'Not provided';

    const message = `Hello Noor Wall Arts! I just placed a new order.

*Order ID:* ${orderPlaced.id}
*Name:* ${orderPlaced.customer.name}
*Mobile:* ${orderPlaced.customer.phone}

*Address:* ${addressDetails}
*Live Location:* ${mapLink}

*Total Amount:* ₹${orderPlaced.totalPrice.toFixed(2)}`;

    const whatsappNumber = '918925325330'; // Your business WhatsApp number
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
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
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
              <button 
                className="btn-outline" 
                onClick={handleWhatsAppOrder}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#25D366', color: '#25D366' }}
              >
                <MessageCircle size={20} /> Send Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const finalTotal = cartTotal + deliveryFee;

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

          <MapPicker 
            onLocationSelect={(loc) => {
              const addr = loc.addressObj;
              setFormData(prev => ({
                ...prev,
                lat: loc.lat,
                lng: loc.lng,
                houseNo: addr?.house_number || prev.houseNo,
                street: addr?.road || prev.street,
                area: addr?.suburb || addr?.neighbourhood || prev.area,
                district: addr?.city_district || addr?.county || addr?.city || prev.district,
                state: addr?.state || prev.state,
                pincode: addr?.postcode || prev.pincode
              }));
            }} 
          />

          <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" required />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Mobile Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your 10-digit mobile number" maxLength="10" pattern="[0-9]{10}" required />
            </div>
            
            <div className="form-group">
              <label>House / Flat / Door No. *</label>
              <input type="text" name="houseNo" value={formData.houseNo} onChange={handleInputChange} placeholder="Enter your house number" required />
            </div>
            
            <div className="form-group">
              <label>Building / Apartment Name (Optional)</label>
              <input type="text" name="building" value={formData.building} onChange={handleInputChange} placeholder="Enter building name" />
            </div>

            <div className="form-group">
              <label>Street / Road Name *</label>
              <input type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="Enter street or road name" required />
            </div>

            <div className="form-group">
              <label>Area / Locality *</label>
              <input type="text" name="area" value={formData.area} onChange={handleInputChange} placeholder="Enter your area" required />
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Enter a landmark" />
            </div>

            <div className="form-group">
              <label>Country *</label>
              <select name="country" value={formData.country} onChange={handleInputChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>State *</label>
              <select name="state" value={formData.state} onChange={handleStateChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }} required>
                <option value="">Select State</option>
                {statesList.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>District / City *</label>
              <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: formData.state ? 'var(--surface-variant)' : 'var(--bg-color)', cursor: formData.state ? 'pointer' : 'not-allowed' }} required>
                <option value="">Select District</option>
                {districtsList.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pincode / Zipcode *</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Enter your pincode/zipcode" required />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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
            <Wallet size={20} className="text-primary" /> Payment
          </h3>

          {paymentMethod === 'UPI' && (
            <div className="stripe-mock-container animate-fade-in" style={{ textAlign: 'center', padding: '2rem', marginTop: '1.5rem', background: 'var(--surface-variant)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Scan the QR Code to pay <strong>₹{finalTotal.toFixed(2)}</strong> via any UPI App.
              </p>
              <div style={{ background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=arahman32773-4@okicici&pn=Noor_Wallarts_Gifts&am=${finalTotal.toFixed(2)}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  style={{ width: '200px', height: '200px' }} 
                />
              </div>
              <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>UPI ID: arahman32773-4@okicici</p>
              
              <div className="form-group stripe-input-group" style={{ marginTop: '2rem', textAlign: 'left' }}>
                <label>UPI Transaction Reference Number *</label>
                <input 
                  type="text" 
                  name="upiRef" 
                  value={formData.upiRef} 
                  onChange={handleInputChange} 
                  placeholder="Enter 12-digit UPI reference number" 
                  required
                />
                <p style={{ fontSize: '0.85rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', marginTop: '0.75rem', border: '1px solid #FCD34D', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>⚠️</span>
                  <span><strong>Important:</strong> Please enter the correct 12-digit Transaction ID. Incorrect IDs will result in order cancellation.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-summary card">
          <h3>Order Total</h3>
          <div className="summary-row">
            <span>Items ({totalItemsInCart})</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
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

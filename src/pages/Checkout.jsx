import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Lock, ShieldCheck, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import indiaData from '../utils/indiaStatesDistricts.json';
import './Checkout.css';

const Checkout = () => {
  const { cartWithProducts, originalSubtotal, totalCouponDiscount, cartTotal, deliveryFee, totalItemsInCart, placeOrder, user, loading, deliveryAddress, finalTotal: contextFinalTotal, paymentSettings, storeSettings } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const paymentMethod = 'Razorpay';
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  
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
      formData.pincode.trim() !== ''
    );
  };

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { state: { from: location.pathname, message: 'Please login to checkout' }, replace: true });
      } else {
        setFormData(prev => ({ ...prev, phone: user.phoneNumber || prev.phone || '' }));
      }
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    if (deliveryAddress) {
      setFormData(prev => ({
        ...prev,
        name: deliveryAddress.name || prev.name || '',
        phone: deliveryAddress.phone || user?.phoneNumber || prev.phone || '',
        houseNo: deliveryAddress.houseNo || prev.houseNo || '',
        building: deliveryAddress.building || prev.building || '',
        street: deliveryAddress.street || prev.street || '',
        area: deliveryAddress.area || prev.area || '',
        landmark: deliveryAddress.landmark || prev.landmark || '',
        district: deliveryAddress.district || prev.district || '',
        state: deliveryAddress.state || prev.state || '',
        country: deliveryAddress.country || prev.country || 'India',
        pincode: deliveryAddress.pincode || prev.pincode || '',
        addressType: deliveryAddress.addressType || prev.addressType || 'Home',
        instructions: deliveryAddress.instructions || prev.instructions || '',
        lat: deliveryAddress.lat ?? prev.lat,
        lng: deliveryAddress.lng ?? prev.lng
      }));
    }
  }, [deliveryAddress, user]);

  if (loading || !user) {
    return <div className="checkout-page animate-fade-in"><div className="container" style={{padding: '2rem'}}>Loading...</div></div>;
  }

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

  const finalTotal = contextFinalTotal ?? (cartTotal + deliveryFee);

  const handleCheckout = async () => {
    setPaymentError(null);
    setIsProcessing(true);

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay Payment Gateway. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }
    
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || paymentSettings?.razorpayKeyId || storeSettings?.razorpayKeyId || 'rzp_live_default';

      const options = {
        key: razorpayKey,
        amount: Math.round(finalTotal * 100),
        currency: 'INR',
        name: "NOOR WALLARTS & GIFTS",
        description: `Order Payment (${totalItemsInCart} items)`,
        image: storeSettings?.logoUrl || '/logo.jpg',
        handler: async function (response) {
          try {
            setIsProcessing(true);
            const paymentDetails = {
              transactionId: response.razorpay_payment_id || `PAY_${Date.now()}`,
              razorpayOrderId: response.razorpay_order_id || 'N/A',
              razorpaySignature: response.razorpay_signature || 'N/A',
              paymentStatus: 'Paid'
            };
            const finalOrder = await placeOrder(formData, 'Razorpay', paymentDetails);
            if (finalOrder) {
              setOrderPlaced(finalOrder);
            }
          } catch (err) {
            console.error("Order creation error:", err);
            setPaymentError("Payment succeeded but order creation failed. Please contact customer support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone,
          email: user?.email || ''
        },
        theme: {
          color: "#D4AF37"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setPaymentError("Payment window was closed before completion. You can retry payment below.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        setIsProcessing(false);
        const errorMsg = response.error?.description || "Payment failed or was declined. Please try again.";
        setPaymentError(errorMsg);
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay Checkout Error:", err);
      setPaymentError(err.message || "An unexpected error occurred while launching payment gateway.");
      setIsProcessing(false);
    }
  };

  const autoWhatsAppTriggeredRef = useRef(false);

  const sendInstantWhatsAppNotification = (order) => {
    if (!order) return;
    
    const customerName = order.customer?.name || 'Valued Customer';
    const customerPhone = order.customer?.phone || 'N/A';
    const totalAmount = Number(order.totalPrice || 0).toFixed(2);
    const paymentStatus = order.paymentStatus || 'Paid ✅';
    const orderId = order.id || 'N/A';

    const productsText = (order.items || []).map((item, idx) => {
      const name = item.title || item.product?.title || 'Product';
      const qty = item.quantity || 1;
      const price = Number(item.price || item.unitPrice || 0).toFixed(2);
      return `${idx + 1}. ${name} (Qty: ${qty}) - ₹${price}`;
    }).join('\n') || (order.itemsSummary || 'Products ordered');

    const message = `🎉 *NEW ORDER CONFIRMED - NOOR KARTS* 🎉

📦 *Order ID:* #${orderId}
👤 *Customer Name:* ${customerName}
📞 *Mobile Number:* ${customerPhone}
💳 *Payment Status:* ${paymentStatus} (${order.paymentMethod || 'Online Payment'})
💰 *Total Paid Amount:* ₹${totalAmount}

🛒 *Ordered Products:*
${productsText}

Thank you for shopping with Noor WallArts & Gifts! Please send this message to receive instant order updates on WhatsApp.`;

    const whatsappUrl = `https://wa.me/918925325330?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleWhatsAppOrder = () => {
    sendInstantWhatsAppNotification(orderPlaced);
  };

  // AUTOMATIC WHATSAPP POPUP DISPATCH (1.5s delay after order completion)
  useEffect(() => {
    if (orderPlaced && !autoWhatsAppTriggeredRef.current) {
      autoWhatsAppTriggeredRef.current = true;
      const timer = setTimeout(() => {
        try {
          sendInstantWhatsAppNotification(orderPlaced);
        } catch (e) {
          console.log("Automatic WhatsApp launch blocked by browser popup blocker:", e);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [orderPlaced]);

  if (orderPlaced) {
    const customerName = orderPlaced.customer?.name || 'Valued Customer';
    const customerPhone = orderPlaced.customer?.phone || 'N/A';
    const customerAddress = [
      orderPlaced.customer?.houseNo,
      orderPlaced.customer?.building,
      orderPlaced.customer?.street,
      orderPlaced.customer?.area,
      orderPlaced.customer?.landmark,
      orderPlaced.customer?.district,
      orderPlaced.customer?.state,
      orderPlaced.customer?.pincode
    ].filter(Boolean).join(', ') || 'Address Provided';

    return (
      <div className="checkout-page confirm-state animate-fade-in" style={{ padding: '2rem 1rem' }}>
        <div className="container" style={{ maxWidth: '680px', margin: '0 auto' }}>
          
          {/* SUCCESS HERO CARD */}
          <div className="order-success-card card" style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: '#DCFCE7', color: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
            }}>
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              🎉 Order Placed Successfully!
            </h2>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#16A34A', margin: '0 0 0.5rem 0' }}>
              Your payment has been received successfully.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
              Your order has been confirmed and is now being processed.
            </p>

            <div style={{
              marginTop: '1.25rem', padding: '0.6rem 1.2rem',
              backgroundColor: '#F8FAFC', borderRadius: '12px',
              display: 'inline-block', border: '1px solid #E2E8F0'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#64748B' }}>Order Reference ID: </span>
              <strong style={{ fontSize: '1rem', color: '#0F172A', fontFamily: 'monospace' }}>#{orderPlaced.id}</strong>
            </div>
          </div>

          {/* ORDER SUMMARY OVERVIEW */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
              📦 Order Details Overview
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.78rem' }}>CUSTOMER</span>
                <strong>{customerName}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.78rem' }}>CONTACT</span>
                <strong>{customerPhone}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.78rem' }}>TOTAL PAID</span>
                <strong style={{ color: '#16A34A' }}>₹{Number(orderPlaced.totalPrice || 0).toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.78rem' }}>PAYMENT STATUS</span>
                <strong style={{ color: '#16A34A' }}>{orderPlaced.paymentStatus || 'Paid ✅'}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>📍 Delivery Address:</span>
              {customerAddress}
            </div>
          </div>

          {/* FALLBACK WHATSAPP SECTION */}
          <div className="whatsapp-fallback-card card" style={{
            backgroundColor: '#F0FDF4',
            border: '2px solid #86EFAC',
            borderRadius: '16px',
            padding: '1.75rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.12)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>📲</span> Get Instant Order Updates on WhatsApp
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#15803D', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Tap the button below to send your pre-filled order details and receive faster updates about your order.
            </p>

            <button 
              onClick={handleWhatsAppOrder}
              style={{
                width: '100%',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#22C55E'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.transform = 'none'; }}
            >
              <MessageCircle size={22} fill="#FFFFFF" color="#25D366" />
              <span>💬 Send Order on WhatsApp for Quick Updates</span>
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ textAlign: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 700 }}>
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    );
  }

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
            defaultLat={formData.lat}
            defaultLng={formData.lng}
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
            <CreditCard size={20} className="text-primary" /> Payment Gateway
          </h3>

          <div style={{ marginTop: '1rem', padding: '1.25rem', border: '2px solid var(--primary)', borderRadius: '12px', backgroundColor: 'var(--surface-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Razorpay Secure Checkout
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: '#D4AF37', color: '#000', borderRadius: '12px', fontWeight: 'bold' }}>Instant</span>
              </div>
              <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Pay instantly using <strong>UPI (Google Pay, PhonePe, Paytm, BHIM)</strong>, Debit / Credit Cards (Visa, MasterCard, RuPay), NetBanking, Wallets, or EMI.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ padding: '4px 10px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>💳 Cards</span>
              <span style={{ padding: '4px 10px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>📱 UPI (GPay/PhonePe)</span>
              <span style={{ padding: '4px 10px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>🏦 Net Banking</span>
              <span style={{ padding: '4px 10px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>🔒 256-Bit SSL Encrypted</span>
            </div>
          </div>

          {paymentError && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#991B1B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={20} color="#DC2626" />
                Payment Unsuccessful
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#7F1D1D' }}>{paymentError}</p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleCheckout} 
                style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', backgroundColor: '#DC2626' }}
              >
                <RefreshCw size={16} /> Retry Payment
              </button>
            </div>
          )}

        </div>

        <div className="checkout-summary card">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Original Price ({totalItemsInCart} items)</span>
            <span>₹{(originalSubtotal || cartTotal).toFixed(2)}</span>
          </div>
          {totalCouponDiscount > 0 && (
            <div className="summary-row" style={{ color: '#16A34A', fontWeight: 600 }}>
              <span>Coupon Discount</span>
              <span>-₹{totalCouponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Shipping Charge</span>
            <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
          </div>
          <hr className="detail-divider" />
          <div className="summary-row total">
            <span>Final Payable Amount</span>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{finalTotal.toFixed(2)}</span>
          </div>

          <button 
            className="btn-primary checkout-btn" 
            onClick={handleCheckout} 
            disabled={isProcessing || !isFormValid()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Lock size={18} />
            {isProcessing ? 'Processing Payment...' : `Pay Now via Razorpay (₹${finalTotal.toFixed(2)})`}
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

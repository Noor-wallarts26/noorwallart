import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, SlidersHorizontal, AlertCircle, ShoppingBag, CheckCircle, Clock, Truck, LogOut, Settings, Lock, Shield } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { products, updateProductSliderStatus, fetchAllOrders, updateOrderStatus, updateProductDeliveryCharge, paymentSettings } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(null); // track which product is updating
  
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [orderMessages, setOrderMessages] = useState({});
  const [orderStatuses, setOrderStatuses] = useState({});
  const [orderCouriers, setOrderCouriers] = useState({});
  const [customCouriers, setCustomCouriers] = useState({});
  const [orderTrackingInfos, setOrderTrackingInfos] = useState({});

  // --- NEW AUTH STATE ---
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('slider'); // 'slider' | 'orders' | 'settings'

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'same-origin' });
        if (res.ok) {
          setIsAdminAuthenticated(true);
        } else {
          setIsAdminAuthenticated(false);
        }
      } catch (e) {
        setIsAdminAuthenticated(false);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      const loadOrders = async () => {
        setIsOrdersLoading(true);
        const fetched = await fetchAllOrders();
        setOrders(fetched);
        
        const initialMsgs = {};
        const initialSts = {};
        const initialCouriers = {};
        const initialCustomCouriers = {};
        const initialTracking = {};
        const knownCouriers = ['', 'India Post', 'DTDC', 'Delhivery', 'BlueDart', 'Ecom Express', 'Xpressbees', 'Shadowfax', 'Professional Couriers', 'Trackon', 'Other'];
        fetched.forEach(o => {
          initialMsgs[o.id] = o.adminMessage || '';
          initialSts[o.id] = o.status || 'Ordered';
          const saved = o.courierPartner || '';
          if (saved && !knownCouriers.includes(saved)) {
            initialCouriers[o.id] = 'Other';
            initialCustomCouriers[o.id] = saved;
          } else {
            initialCouriers[o.id] = saved;
            initialCustomCouriers[o.id] = '';
          }
          initialTracking[o.id] = o.trackingInfo || '';
        });
        setOrderMessages(initialMsgs);
        setOrderStatuses(initialSts);
        setOrderCouriers(initialCouriers);
        setCustomCouriers(initialCustomCouriers);
        setOrderTrackingInfos(initialTracking);
        
        setIsOrdersLoading(false);
      };
      loadOrders();
    }
  }, [isAdminAuthenticated, fetchAllOrders]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;
    setIsLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: 'same-origin'
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
        setLoginEmail('');
        setLoginPassword('');
      } else if (res.status === 429) {
        setIsLockedOut(true);
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Too many attempts. Please try again later.');
      } else if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'User ID or Password is incorrect.');
      } else {
        setLoginError('An error occurred. Please try again.');
      }
    } catch (err) {
      setLoginError('An error occurred. Please try again.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch(e) {}
    setIsAdminAuthenticated(false);
    setIsPinVerified(false);
    setPinInput('');
  };

  const handlePinVerify = async (e) => {
    e.preventDefault();
    if (isPinLocked) return;
    setIsPinLoading(true);
    setPinError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
        credentials: 'same-origin'
      });
      if (res.ok) {
        setIsPinVerified(true);
      } else if (res.status === 429) {
        setIsPinLocked(true);
        const data = await res.json().catch(() => ({}));
        setPinError(data.error || 'Too many attempts. Please try again later.');
      } else if (res.status === 401) {
        setPinError('Incorrect PIN.');
      } else {
        setPinError('An error occurred. Please try again.');
      }
    } catch (err) {
      setPinError('An error occurred. Please try again.');
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId) => {
    const status = orderStatuses[orderId];
    const msg = orderMessages[orderId];
    const courierSelection = orderCouriers[orderId] || '';
    const courier = courierSelection === 'Other' ? (customCouriers[orderId] || '').trim() : courierSelection;
    const trackingInfo = (orderTrackingInfos[orderId] || '').trim();
    const success = await updateOrderStatus(orderId, status, msg, courier, trackingInfo);
    if (success) {
      alert("Order updated successfully!");
    } else {
      alert("Failed to update order.");
    }
  };

  const sliderCount = products.filter(p => p.showInSlider).length;

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSlider = async (productId, currentStatus) => {
    // If trying to add, but we already have 10, prevent it
    if (!currentStatus && sliderCount >= 10) {
      alert("You can only select up to 10 products for the slider.");
      return;
    }
    
    setIsUpdating(productId);
    await updateProductSliderStatus(productId, !currentStatus);
    setIsUpdating(null);
  };

  if (isCheckingSession) {
    return (
      <div className="admin-page container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p>Verifying session...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="admin-page animate-fade-in container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="Admin Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1.5rem' }}>Admin Login</h2>
          
          {isLockedOut ? (
            <div className="admin-alert" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'center', background: '#ffebee', color: '#c62828' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.9rem' }}>Account is temporarily locked due to too many failed attempts. Please try again later.</span>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loginError && (
                <div style={{ color: 'var(--error-color, #ef4444)', fontSize: '0.9rem', textAlign: 'center' }}>
                  {loginError}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Email</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isLoginLoading}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                {isLoginLoading ? 'Logging in...' : <><Lock size={18} /> Login</>}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in container">
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="admin-logo-wrapper">
            <img src="/logo.jpg" alt="Admin Logo" className="admin-logo" />
            <span className="admin-logo-text">Admin</span>
          </div>
          <h1 style={{ marginTop: '0.5rem' }}>Admin Control Panel</h1>
          <p>Manage your website content and settings</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('slider')}
          style={{ background: activeTab === 'slider' ? 'var(--primary)' : 'transparent', color: activeTab === 'slider' ? 'white' : 'var(--text-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          <SlidersHorizontal size={18} /> Slider Control
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          style={{ background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'var(--text-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          <ShoppingBag size={18} /> Orders
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ background: activeTab === 'settings' ? 'var(--primary)' : 'transparent', color: activeTab === 'settings' ? 'white' : 'var(--text-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      {activeTab === 'slider' && (
        <section className="admin-section animate-fade-in">
          <div className="section-header">
            <div className="section-title">
              <SlidersHorizontal size={24} color="var(--primary)" />
              <h2>Hero Slider Control</h2>
            </div>
            <span className={`slider-count-badge ${sliderCount >= 10 ? 'max-reached' : ''}`}>
              {sliderCount} / 10 Selected
            </span>
          </div>
          
          <p className="section-description">
            Choose up to 10 products to display in the main sliding banner on the home page.
          </p>

          {sliderCount === 0 && (
            <div className="admin-alert">
              <AlertCircle size={18} />
              <span>Currently no products are selected. The system is showing 10 recent products as a fallback.</span>
            </div>
          )}

          <div className="admin-search">
            <Search size={20} className="search-icon" color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search products to add to slider..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-product-list">
            {filteredProducts.map(product => (
              <div key={product.id} className={`admin-product-item ${product.showInSlider ? 'selected-for-slider' : ''}`}>
                <div className="product-item-info">
                  <div 
                    className="product-item-image"
                    style={{ backgroundImage: `url(${product.imageUrl})` }}
                  >
                    {!product.imageUrl && <span style={{fontSize: '10px'}}>{product.title}</span>}
                  </div>
                  <div className="product-item-details">
                    <h4>{product.title}</h4>
                    <span>₹{product.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="product-item-action" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Delivery Fee</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>₹</span>
                      <input 
                        type="number" 
                        defaultValue={product.deliveryCharge !== undefined ? product.deliveryCharge : 80}
                        onBlur={(e) => {
                          const newCharge = e.target.value;
                          if (newCharge !== '' && Number(newCharge) >= 0) {
                            updateProductDeliveryCharge(product.id, newCharge);
                          }
                        }}
                        disabled={isUpdating === product.id}
                        style={{ width: '70px', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Show in Slider</label>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={product.showInSlider || false}
                        onChange={() => handleToggleSlider(product.id, product.showInSlider)}
                        disabled={isUpdating === product.id}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="empty-admin-list">No products found.</div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="admin-section animate-fade-in">
          <div className="section-header">
            <div className="section-title">
              <ShoppingBag size={24} color="var(--primary)" />
              <h2>Order Management</h2>
            </div>
          </div>
          
          <p className="section-description">
            View customer orders, update their delivery status, and send custom tracking messages.
          </p>

          {isOrdersLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-admin-list">No orders found.</div>
          ) : (
            <div className="admin-orders-list">
              {orders.map(order => (
                <div key={order.id} className="admin-order-card card">
                  <div className="order-card-header">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Order #{order.id}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(order.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      ₹{order.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="order-customer-details" style={{ margin: '1rem 0', padding: '1rem', background: 'var(--surface-variant)', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone})
                    </p>
                    
                    <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Door/House No:</span> <br/><strong>{order.customer?.houseNo || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Building Name:</span> <br/><strong>{order.customer?.building || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Street:</span> <br/><strong>{order.customer?.street || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Area:</span> <br/><strong>{order.customer?.area || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Landmark:</span> <br/><strong>{order.customer?.landmark || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>City/District:</span> <br/><strong>{order.customer?.district || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>State:</span> <br/><strong>{order.customer?.state || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Pincode:</span> <br/><strong>{order.customer?.pincode || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Country:</span> <br/><strong>{order.customer?.country || 'India'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Address Type:</span> <br/><strong>{order.customer?.addressType || 'Home'}</strong></div>
                    </div>

                    {order.customer?.instructions && (
                      <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Delivery Instructions:</span><br/>
                        <strong>{order.customer.instructions}</strong>
                      </div>
                    )}

                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Items Ordered:</strong> <span style={{ color: 'var(--primary)' }}>{order.itemsSummary}</span></p>
                      <p><strong>Payment:</strong> {order.paymentMethod} {order.transactionId && `(Txn ID: ${order.transactionId})`}</p>
                    </div>
                  </div>

                  <div className="order-action-controls" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Status</label>
                      <select 
                        value={orderStatuses[order.id]} 
                        onChange={(e) => setOrderStatuses(prev => ({...prev, [order.id]: e.target.value}))}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                      >
                        <option value="Ordered">Ordered</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Courier Partner</label>
                      <select
                        value={orderCouriers[order.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOrderCouriers(prev => ({...prev, [order.id]: val}));
                          if (val !== 'Other') setCustomCouriers(prev => ({...prev, [order.id]: ''}));
                        }}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                      >
                        <option value="">— Select Courier —</option>
                        <option value="India Post">India Post</option>
                        <option value="DTDC">DTDC</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="BlueDart">BlueDart</option>
                        <option value="Ecom Express">Ecom Express</option>
                        <option value="Xpressbees">Xpressbees</option>
                        <option value="Shadowfax">Shadowfax</option>
                        <option value="Professional Couriers">Professional Couriers</option>
                        <option value="Trackon">Trackon</option>
                        <option value="Other">Other (Manual Entry)</option>
                      </select>
                    </div>
                  </div>

                  {orderCouriers[order.id] === 'Other' && (
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Custom Courier Name</label>
                      <input
                        type="text"
                        value={customCouriers[order.id] || ''}
                        onChange={(e) => setCustomCouriers(prev => ({...prev, [order.id]: e.target.value}))}
                        placeholder="Enter courier name"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Tracking Number / Link</label>
                    <input 
                      type="text" 
                      value={orderTrackingInfos[order.id] || ''}
                      onChange={(e) => setOrderTrackingInfos(prev => ({...prev, [order.id]: e.target.value}))}
                      placeholder="e.g. AWB123456789 or https://tracking.link"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr auto' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Admin Message to Customer</label>
                      <input 
                        type="text" 
                        value={orderMessages[order.id]}
                        onChange={(e) => setOrderMessages(prev => ({...prev, [order.id]: e.target.value}))}
                        placeholder="e.g. Will arrive in 2 days"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleUpdateOrder(order.id)}
                        style={{ padding: '0.6rem 1.5rem', height: 'max-content', borderRadius: '8px' }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="admin-section animate-fade-in">
          <div className="section-header">
            <div className="section-title">
              <Shield size={24} color="var(--primary)" />
              <h2>Payment Settings</h2>
            </div>
          </div>
          <p className="section-description">
            View sensitive payment configuration.
          </p>

          <div className="card" style={{ padding: '2rem' }}>
            {isPinLocked ? (
              <div className="admin-alert" style={{ background: '#ffebee', color: '#c62828' }}>
                <AlertCircle size={18} />
                <span>Payment Settings access is temporarily locked. Please try again later.</span>
              </div>
            ) : !isPinVerified ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Security Verification</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Please enter your 6-digit PIN to access payment settings.
                </p>
                <form onSubmit={handlePinVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pinError && <div style={{ color: 'var(--error-color, #ef4444)', fontSize: '0.9rem', textAlign: 'center' }}>{pinError}</div>}
                  <input 
                    type="password" 
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN"
                    maxLength={6}
                    required
                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  />
                  <button type="submit" className="btn-primary" disabled={isPinLoading || pinInput.length !== 6}>
                    {isPinLoading ? 'Verifying...' : 'Verify PIN'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Current Payment Configuration</h3>
                  <button onClick={() => setIsPinVerified(false)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    Lock Again
                  </button>
                </div>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>UPI ID</label>
                    <div style={{ padding: '1rem', background: 'var(--surface-variant)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                      {paymentSettings?.upiId || 'Not configured'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>QR Code URL</label>
                    <div style={{ padding: '1rem', background: 'var(--surface-variant)', borderRadius: '8px', wordBreak: 'break-all' }}>
                      {paymentSettings?.qrCodeUrl || 'Not configured'}
                    </div>
                    {paymentSettings?.qrCodeUrl && (
                      <div style={{ marginTop: '1rem' }}>
                        <img src={paymentSettings.qrCodeUrl} alt="UPI QR Code" style={{ maxWidth: '200px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', background: 'white' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
};

export default Admin;

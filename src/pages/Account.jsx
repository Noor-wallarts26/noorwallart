import React, { useContext, useState, useEffect } from 'react';
import { Package, MapPin, ChevronRight, ChevronDown, Phone, Mail, LogOut } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import indiaData from '../utils/indiaStatesDistricts.json';

const Account = () => {
  const { user, loading, logout, deliveryAddress, setDeliveryAddress, saveDeliveryAddressToDB, fetchMyOrders } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [expandedSection, setExpandedSection] = useState(null); // 'orders' | 'address' | null
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  const defaultAddressState = {
    name: '', phone: '', houseNo: '', building: '', street: '', 
    area: '', landmark: '', district: '', state: '', country: 'India', pincode: '', 
    addressType: 'Home', instructions: '', lat: null, lng: null
  };
  
  const [addressInput, setAddressInput] = useState(deliveryAddress || defaultAddressState);
  const [isSaved, setIsSaved] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Sync address input when deliveryAddress loads from Firestore
  useEffect(() => {
    if (deliveryAddress) {
      setAddressInput(deliveryAddress);
    }
  }, [deliveryAddress]);

  const statesList = React.useMemo(() => {
    return indiaData.states.map(s => s.state).sort((a, b) => a.localeCompare(b));
  }, []);

  const districtsList = React.useMemo(() => {
    const selectedStateObj = indiaData.states.find(s => s.state === addressInput.state);
    if (selectedStateObj) {
      return [...selectedStateObj.districts].sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [addressInput.state]);

  // Fetch orders when section expands
  useEffect(() => {
    if (user && expandedSection === 'orders') {
      setIsOrdersLoading(true);
      fetchMyOrders(user.uid).then(fetched => {
        setMyOrders(fetched);
        setIsOrdersLoading(false);
      });
    }
  }, [user, expandedSection, fetchMyOrders]);

  const handleAddressChange = (e) => {
    if (e.target.name === 'state') {
      setAddressInput({ ...addressInput, state: e.target.value, district: '' });
    } else {
      setAddressInput({ ...addressInput, [e.target.name]: e.target.value });
    }
  };

  const isAddressValid = () => {
    return (
      !!addressInput.name?.trim() &&
      !!addressInput.phone?.trim() &&
      !!addressInput.houseNo?.trim() &&
      !!addressInput.street?.trim() &&
      !!addressInput.area?.trim() &&
      !!addressInput.district?.trim() &&
      !!addressInput.state?.trim() &&
      !!addressInput.pincode?.trim()
    );
  };

  const toggleSection = (section) => {
    if (!user && section !== null) {
      alert("Please login first to view this section.");
      return;
    }
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleSaveAddress = async () => {
    if (saveDeliveryAddressToDB) {
      await saveDeliveryAddressToDB(addressInput);
    } else {
      setDeliveryAddress(addressInput);
    }
    setIsSaved(true);
    setIsEditingAddress(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (loading) {
    return <div className="account-page animate-fade-in container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="account-page animate-fade-in">
      <div className="container" style={{ paddingBottom: '100px', paddingTop: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Top Card: Login or Profile */}
        <div className="account-top-card">
          {!user ? (
            <Login embedded={true} />
          ) : (
            <div className="profile-card card">
              <div className="profile-header">
                <img src="/logo.jpg" alt="Noor Wall Arts & Gifts" className="profile-avatar" />
                <div className="profile-info">
                  <h3 className="brand-title" style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{user.displayName || 'NOOR WALL ARTS & GIFTS'}</h3>
                  <p className="profile-phone">{user.email || user.phoneNumber}</p>
                </div>
              </div>
              <button onClick={logout} className="btn-outline logout-btn-full">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Menu Cards */}
        <div className="account-menu-card card">
          {/* My Orders Menu Item */}
          <div className="menu-item-wrapper">
            <div className="menu-item" onClick={() => toggleSection('orders')}>
              <div className="menu-icon-bg" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                <Package size={20} />
              </div>
              <div className="menu-text">
                <h4>My Orders</h4>
                <p>View order history</p>
              </div>
              {expandedSection === 'orders' ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>
            
            {/* Expanded Orders Section */}
            {expandedSection === 'orders' && (
              <div className="menu-expanded-content">
                {isOrdersLoading ? (
                  <div className="empty-state-mini">
                    <p>Loading your orders...</p>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="empty-state-mini">
                    <p>No orders found.</p>
                    <button className="btn-primary mt-2" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem' }}>Shop Now</button>
                  </div>
                ) : (
                  <div className="orders-list-mini">
                    {myOrders.map(order => (
                      <div key={order.id} className="order-item-mini" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1rem' }}>
                        <div className="order-header-mini" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span className="order-id-mini" style={{ fontWeight: 'bold' }}>#{order.id}</span>
                          <span className="order-total-mini" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="order-status-mini" style={{ 
                            fontWeight: '600',
                            color: (order.status || '').toLowerCase() === 'delivered' ? '#16a34a' 
                                 : (order.status || '').toLowerCase() === 'cancelled' ? '#ef4444' 
                                 : '#f59e0b' 
                          }}>
                            Status: {order.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(order.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        {/* ORDER ITEMS LIST */}
                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <img src={item.imageUrl || '/logo.jpg'} alt={item.title} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                  <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Qty: {item.quantity} × ₹{item.price}</p>
                                  </div>
                                </div>

                                {(order.status || '').toLowerCase() === 'delivered' && (
                                  <button
                                    onClick={() => navigate(`/product/${item.productId}`)}
                                    style={{
                                      padding: '0.35rem 0.75rem', borderRadius: '6px',
                                      backgroundColor: 'var(--primary, #4f46e5)', color: '#fff',
                                      border: 'none', fontSize: '0.75rem', fontWeight: 600,
                                      cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                    }}
                                  >
                                    ⭐ Write Review
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {order.adminMessage && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--surface-variant)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                              💬 {order.adminMessage}
                            </p>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="menu-divider"></div>

          {/* Delivery Address Menu Item */}
          <div className="menu-item-wrapper">
            <div className="menu-item" onClick={() => toggleSection('address')}>
              <div className="menu-icon-bg" style={{ backgroundColor: '#FCE7F3', color: '#DB2777' }}>
                <MapPin size={20} />
              </div>
              <div className="menu-text">
                <h4>Delivery Address</h4>
                <p>Manage saved addresses</p>
              </div>
              {expandedSection === 'address' ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>

            {/* Expanded Address Section */}
            {expandedSection === 'address' && (
              <div className="menu-expanded-content">
                {deliveryAddress && !isEditingAddress ? (
                  /* SAVED DEFAULT ADDRESS CARD */
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        backgroundColor: '#10B981', color: '#FFFFFF', padding: '0.25rem 0.6rem',
                        borderRadius: '6px', letterSpacing: '0.5px'
                      }}>
                        Default Active Delivery Address
                      </span>
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        style={{
                          backgroundColor: '#0F172A', color: '#FFFFFF',
                          border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px',
                          fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                        }}
                      >
                        ✏️ Edit Address
                      </button>
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                      {deliveryAddress.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                      📞 Mobile: <strong>{deliveryAddress.phone}</strong>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                      {[
                        deliveryAddress.houseNo ? `#${deliveryAddress.houseNo}` : '',
                        deliveryAddress.building,
                        deliveryAddress.street,
                        deliveryAddress.area,
                        deliveryAddress.landmark ? `(Near ${deliveryAddress.landmark})` : '',
                        deliveryAddress.district,
                        deliveryAddress.state,
                        deliveryAddress.pincode ? `- ${deliveryAddress.pincode}` : '',
                        deliveryAddress.country
                      ].filter(Boolean).join(', ')}
                    </div>

                    {typeof deliveryAddress.lat === 'number' && typeof deliveryAddress.lng === 'number' && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.75rem', color: '#059669', backgroundColor: '#ECFDF5',
                        padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 600,
                        border: '1px solid #A7F3D0'
                      }}>
                        <MapPin size={14} /> Pinned Location: {deliveryAddress.lat.toFixed(4)}, {deliveryAddress.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDIT / NEW ADDRESS FORM WITH GOOGLE MAP PICKER */
                  <div>
                    {deliveryAddress && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Editing Delivery Address</h5>
                        <button
                          onClick={() => setIsEditingAddress(false)}
                          style={{
                            backgroundColor: 'transparent', color: '#64748B', border: '1px solid #CBD5E1',
                            padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <MapPicker 
                      defaultLat={addressInput.lat}
                      defaultLng={addressInput.lng}
                      onLocationSelect={(loc) => {
                        const addr = loc.addressObj;
                        setAddressInput(prev => ({
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

                    <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Full Name *</label>
                        <input type="text" name="name" value={addressInput.name || ''} onChange={handleAddressChange} placeholder="Enter your full name" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Mobile Number *</label>
                        <input type="tel" name="phone" value={addressInput.phone || ''} onChange={handleAddressChange} placeholder="Enter your 10-digit mobile number" maxLength="10" pattern="[0-9]{10}" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>House / Door No. *</label>
                        <input type="text" name="houseNo" value={addressInput.houseNo || ''} onChange={handleAddressChange} placeholder="Enter house number" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Building (Optional)</label>
                        <input type="text" name="building" value={addressInput.building || ''} onChange={handleAddressChange} placeholder="Enter building" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Street / Road *</label>
                        <input type="text" name="street" value={addressInput.street || ''} onChange={handleAddressChange} placeholder="Enter street" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Area / Locality *</label>
                        <input type="text" name="area" value={addressInput.area || ''} onChange={handleAddressChange} placeholder="Enter area" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Landmark (Optional)</label>
                        <input type="text" name="landmark" value={addressInput.landmark || ''} onChange={handleAddressChange} placeholder="Enter landmark" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Country *</label>
                        <select name="country" value={addressInput.country || 'India'} onChange={handleAddressChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
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
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>State *</label>
                        <select name="state" value={addressInput.state || ''} onChange={handleAddressChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
                          <option value="">Select State</option>
                          {statesList.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>District / City *</label>
                        <select name="district" value={addressInput.district || ''} onChange={handleAddressChange} disabled={!addressInput.state} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: addressInput.state ? 'var(--surface-variant)' : 'var(--bg-color)', cursor: addressInput.state ? 'pointer' : 'not-allowed' }}>
                          <option value="">Select District</option>
                          {districtsList.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Pincode *</label>
                        <input type="text" name="pincode" value={addressInput.pincode || ''} onChange={handleAddressChange} placeholder="Enter pincode" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>
                      
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Address Type *</label>
                        <select name="addressType" value={addressInput.addressType || 'Home'} onChange={handleAddressChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
                          <option value="Home">Home (All day delivery)</option>
                          <option value="Office">Office (Delivery between 10 AM - 5 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Delivery Instructions (Optional)</label>
                      <textarea name="instructions" value={addressInput.instructions || ''} onChange={handleAddressChange} rows="2" placeholder="Describe your delivery instructions" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}></textarea>
                    </div>

                    {!isAddressValid() && (
                      <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                        Please fill all mandatory (*) fields to save your address.
                      </p>
                    )}

                    <div className="address-actions mt-2" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                      <button onClick={handleSaveAddress} className="btn-primary" style={{ padding: '0.75rem 1.5rem', width: '100%' }} disabled={!isAddressValid()}>
                        Save Address
                      </button>
                      {isSaved && <span className="save-success" style={{ color: 'var(--success)', fontWeight: 'bold' }}>Saved!</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Store Contact Info Card */}
        <div className="account-contact-card card">
          <h3 className="contact-card-title">Store Contact Info</h3>

          <a href="tel:+918925325330" target="_blank" rel="noreferrer" className="contact-list-item">
            <div className="contact-icon-mini phone">
              <Phone size={20} />
            </div>
            <span className="contact-list-text">Call: +91 8925325330</span>
          </a>

          <div className="contact-divider"></div>
          
          <a href="https://wa.me/918925325330" target="_blank" rel="noreferrer" className="contact-list-item">
            <div className="contact-icon-mini whatsapp">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <span className="contact-list-text">WhatsApp</span>
          </a>
          
          <div className="contact-divider"></div>
          
          <a href="mailto:noorkarts.in@gmail.com" className="contact-list-item">
            <div className="contact-icon-mini email">
              <Mail size={20} />
            </div>
            <span className="contact-list-text">Email Us</span>
          </a>

          <div className="contact-divider"></div>

          <a href="https://instagram.com/noor.wallarts" target="_blank" rel="noreferrer" className="contact-list-item">
            <div className="contact-icon-mini instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <span className="contact-list-text">Instagram</span>
          </a>
        </div>

      </div>
      <Footer showSignature={true} />
    </div>
  );
};

export default Account;

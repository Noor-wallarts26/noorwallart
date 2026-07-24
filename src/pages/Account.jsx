import React, { useContext, useState } from 'react';
import { Package, MapPin, ChevronRight, ChevronDown, Phone, Mail, LogOut } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { orders, user, loading, logout, deliveryAddress, setDeliveryAddress } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [expandedSection, setExpandedSection] = useState(null); // 'orders' | 'address' | null
  
  const defaultAddressState = {
    name: '', phone: '', houseNo: '', building: '', street: '', 
    area: '', landmark: '', district: '', state: '', pincode: '', 
    addressType: 'Home', instructions: '', lat: null, lng: null
  };
  
  const [addressInput, setAddressInput] = useState(deliveryAddress || defaultAddressState);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddressChange = (e) => {
    setAddressInput({ ...addressInput, [e.target.name]: e.target.value });
  };

  const isAddressValid = () => {
    return (
      addressInput.name?.trim() !== '' &&
      addressInput.phone?.trim() !== '' &&
      addressInput.houseNo?.trim() !== '' &&
      addressInput.street?.trim() !== '' &&
      addressInput.area?.trim() !== '' &&
      addressInput.district?.trim() !== '' &&
      addressInput.state?.trim() !== '' &&
      addressInput.pincode?.trim() !== ''
    );
  };

  const toggleSection = (section) => {
    if (!user && section !== null) {
      alert("Please login first to view this section.");
      return;
    }
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleSaveAddress = () => {
    setDeliveryAddress(addressInput);
    setIsSaved(true);
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
                <img src="/logo.jpg" alt="Noor Wall Arts" className="profile-avatar" />
                <div className="profile-info">
                  <h3 className="brand-title" style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{user.displayName || 'NOOR WALL ARTS'}</h3>
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
                {orders.length === 0 ? (
                  <div className="empty-state-mini">
                    <p>No orders found.</p>
                    <button className="btn-primary mt-2" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem' }}>Shop Now</button>
                  </div>
                ) : (
                  <div className="orders-list-mini">
                    {orders.map(order => (
                      <div key={order.id} className="order-item-mini">
                        <div className="order-header-mini">
                          <span className="order-id-mini">#{order.id}</span>
                          <span className="order-total-mini">₹{order.totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="order-status-mini" style={{ color: order.status === 'Pending' ? 'var(--warning, #f59e0b)' : (order.status === 'Accepted' ? 'var(--success, #10b981)' : 'var(--text-secondary)') }}>
                          {order.status === 'Pending' ? '⏳ Order Pending' : (order.status === 'Accepted' ? '✅ Order Accepted' : order.status)}
                        </p>
                        {order.paymentStatus && (
                          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: order.paymentStatus === 'PAID' ? 'var(--success, #10b981)' : 'var(--text-secondary)' }}>
                            Payment: {order.paymentStatus === 'PAID' ? '✅ PAID' : order.paymentStatus}
                          </p>
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
                <MapPicker 
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

                <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>District *</label>
                    <input type="text" name="district" value={addressInput.district || ''} onChange={handleAddressChange} placeholder="Enter district" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>State *</label>
                    <input type="text" name="state" value={addressInput.state || ''} onChange={handleAddressChange} placeholder="Enter state" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
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
        </div>

        {/* Store Contact Info Card */}
        <div className="account-contact-card card">
          <h3 className="contact-card-title">Store Contact Info</h3>
          
          <a href="https://wa.me/918925325330" target="_blank" rel="noreferrer" className="contact-list-item">
            <div className="contact-icon-mini whatsapp">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <span className="contact-list-text">WhatsApp</span>
          </a>
          
          <div className="contact-divider"></div>
          
          <a href="mailto:noorwallartsofficial@gmail.com" className="contact-list-item">
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
      <Footer />
    </div>
  );
};

export default Account;

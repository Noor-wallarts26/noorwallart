import React, { useContext, useState, useEffect } from 'react';
import { Package, MapPin, ChevronRight, ChevronDown, Phone, Mail, LogOut, User, Edit3, ShieldCheck, MessageSquare } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import MapPicker from '../components/MapPicker';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
import indiaData from '../utils/indiaStatesDistricts.json';

import { lookupIndianPincode } from '../utils/pincodeService';
import CustomerOrdersView from '../components/CustomerOrdersView';

const InstagramIcon = ({ size = 18, color = '#DB2777' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Account = () => {
  const { user, loading, logout, deliveryAddress, setDeliveryAddress, saveDeliveryAddressToDB, fetchMyOrders, storeSettings } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [expandedSection, setExpandedSection] = useState('orders'); // 'orders' | 'profile' | 'address' | null
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  // Read tab parameter from URL query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'profile') {
      setExpandedSection('profile');
    } else if (tabParam === 'address') {
      setExpandedSection('address');
    } else if (tabParam === 'orders') {
      setExpandedSection('orders');
    }
  }, [location.search]);
  
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
      setAddressInput({ ...deliveryAddress, country: 'India' });
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

  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAddressInput(prev => ({ ...prev, pincode: val }));
    setPincodeError('');

    if (val.length === 6) {
      setIsPincodeLoading(true);
      const res = await lookupIndianPincode(val);
      setIsPincodeLoading(false);

      if (res.success) {
        setAddressInput(prev => ({
          ...prev,
          pincode: val,
          state: res.state || prev.state,
          district: res.district || prev.district,
          area: prev.area || res.primaryLocality || '',
          country: 'India'
        }));
      } else {
        setPincodeError(res.message);
      }
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
      !!addressInput.pincode?.trim() &&
      /^[1-9][0-9]{5}$/.test(addressInput.pincode.trim())
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
            <div className="profile-card card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
              <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary, #4F46E5)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  overflow: 'hidden',
                  border: '3px solid #E2E8F0',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  marginBottom: '0.75rem'
                }}>
                  {user.photoURL && !avatarError ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Profile'} 
                      onError={() => setAvatarError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="profile-info">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                    {user.displayName || deliveryAddress?.name || 'Valued Customer'}
                  </h3>
                  {user.email && (
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <Mail size={14} /> {user.email}
                    </p>
                  )}
                  {(user.phoneNumber || deliveryAddress?.phone) && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <Phone size={14} /> {user.phoneNumber || deliveryAddress?.phone}
                    </p>
                  )}
                </div>
              </div>

              <button onClick={logout} className="btn-outline logout-btn-full" style={{ borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700 }}>
                <LogOut size={16} /> Logout Account
              </button>
            </div>
          )}
        </div>

        {/* Menu Cards */}
        <div className="account-menu-card card">
          
          {/* 1. My Profile Menu Item */}
          <div className="menu-item-wrapper">
            <div className="menu-item" onClick={() => toggleSection('profile')}>
              <div className="menu-icon-bg" style={{ backgroundColor: '#E0E7FF', color: '#4F46E5' }}>
                <User size={20} />
              </div>
              <div className="menu-text">
                <h4>My Profile</h4>
                <p>Personal details & account information</p>
              </div>
              {expandedSection === 'profile' ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>

            {/* Expanded Profile Section */}
            {expandedSection === 'profile' && user && (
              <div className="menu-expanded-content" style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', margin: '0 1rem 1rem 1rem' }}>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                  My Profile
                </h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Name</span>
                    <strong style={{ color: '#0F172A' }}>{user.displayName || deliveryAddress?.name || 'Customer'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Email</span>
                    <strong style={{ color: '#0F172A' }}>{user.email || 'Not provided'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile Number</span>
                    <strong style={{ color: '#0F172A' }}>{user.phoneNumber || deliveryAddress?.phone || 'Not provided'}</strong>
                  </div>
                  {deliveryAddress && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingTop: '0.2rem' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Address</span>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: '1.4' }}>
                        {[deliveryAddress.houseNo, deliveryAddress.building, deliveryAddress.street, deliveryAddress.area, deliveryAddress.district, deliveryAddress.state, deliveryAddress.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    onClick={() => toggleSection('address')}
                    className="btn-outline"
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <Edit3 size={14} /> Edit Address
                  </button>
                </div>

                {/* PROFILE CONTACT OPTIONS SEQUENCE */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
                  <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                    Customer Support & Contact
                  </h5>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {/* Mobile */}
                    <a 
                      href={`tel:${storeSettings?.whatsapp || '+918925325330'}`} 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A' }}
                    >
                      <Phone size={18} color="var(--primary, #4F46E5)" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>Mobile</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{storeSettings?.whatsapp || '+91 89253 25330'}</div>
                      </div>
                    </a>

                    {/* WhatsApp */}
                    <a 
                      href={`https://wa.me/91${(storeSettings?.whatsapp || '8925325330').replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #DCFCE7', textDecoration: 'none', color: '#166534' }}
                    >
                      <MessageSquare size={18} color="#25D366" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#15803D', fontWeight: 700 }}>WhatsApp</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Chat Support</div>
                      </div>
                    </a>

                    {/* Email */}
                    <a 
                      href="mailto:noorkarts.in@gmail.com" 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A' }}
                    >
                      <Mail size={18} color="#2563EB" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>Email</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, wordBreak: 'break-all' }}>noorkarts.in@gmail.com</div>
                      </div>
                    </a>

                    {/* Instagram */}
                    <a 
                      href={storeSettings?.instagram ? (storeSettings.instagram.startsWith('http') ? storeSettings.instagram : `https://instagram.com/${storeSettings.instagram.replace('@', '')}`) : 'https://instagram.com'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FDF2F8', borderRadius: '10px', border: '1px solid #FCE7F3', textDecoration: 'none', color: '#9D174D' }}
                    >
                      <InstagramIcon size={18} color="#DB2777" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#BE185D', fontWeight: 700 }}>Instagram</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{storeSettings?.instagram || '@noorkarts'}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="menu-divider"></div>

          {/* 2. My Orders Menu Item */}
          <div className="menu-item-wrapper">
            <div className="menu-item" onClick={() => toggleSection('orders')}>
              <div className="menu-icon-bg" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                <Package size={20} />
              </div>
              <div className="menu-text">
                <h4>My Orders</h4>
                <p>View order history & track delivery</p>
              </div>
              {expandedSection === 'orders' ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
            </div>
            
            {/* Expanded Orders Section */}
            {expandedSection === 'orders' && (
              <div className="menu-expanded-content" style={{ paddingTop: '1rem' }}>
                <CustomerOrdersView user={user} onNavigateToShop={() => navigate('/')} />
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
                        deliveryAddress.pincode ? `- ${deliveryAddress.pincode}` : ''
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

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Pincode (6-Digit Indian Pincode) *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={addressInput.pincode || ''}
                          onChange={handlePincodeChange}
                          placeholder="Enter 6-digit Indian Pincode (e.g. 629001)"
                          maxLength="6"
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                        />
                        {isPincodeLoading && (
                          <p style={{ fontSize: '0.78rem', color: '#059669', margin: '0.3rem 0 0 0', fontWeight: 600 }}>
                            ⏳ Detecting State & District from Pincode...
                          </p>
                        )}
                        {pincodeError && (
                          <p style={{ fontSize: '0.78rem', color: '#DC2626', margin: '0.3rem 0 0 0', fontWeight: 600 }}>
                            ⚠️ {pincodeError}
                          </p>
                        )}
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
                        <input type="text" name="area" value={addressInput.area || ''} onChange={handleAddressChange} placeholder="Enter area or town" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Landmark (Optional)</label>
                        <input type="text" name="landmark" value={addressInput.landmark || ''} onChange={handleAddressChange} placeholder="Enter landmark" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
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

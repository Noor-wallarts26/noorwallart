import React, { useContext, useState } from 'react';
import { Phone, Mail, LogOut, MessageSquare, Edit3, CheckCircle, X } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const { user, loading, logout, deliveryAddress, storeSettings, updateUserProfile } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if user navigated specifically to My Orders view (/account?tab=orders)
  const queryParams = new URLSearchParams(location.search);
  const isOrdersView = queryParams.get('tab') === 'orders';

  const [avatarError, setAvatarError] = useState(false);

  // Edit Profile Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Helper to extract clean 10-digit Indian phone number (removes duplicate 91/911 prefixes)
  const getCleanPhoneDigits = (rawPhone) => {
    if (!rawPhone) return '8925325330';
    const digits = String(rawPhone).replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits || '8925325330';
  };

  const phoneDigits = getCleanPhoneDigits(storeSettings?.whatsapp || '8925325330');
  const whatsappUrl = `https://wa.me/91${phoneDigits}`;
  const callUrl = `tel:+91${phoneDigits}`;
  const callFormattedDisplay = `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`;

  const emailAddress = storeSettings?.email || 'noorkarts.in@gmail.com';
  const emailUrl = `mailto:${emailAddress}`;

  const rawInstagram = storeSettings?.instagram || '@noorkarts';
  const instagramUrl = rawInstagram.startsWith('http')
    ? rawInstagram
    : `https://instagram.com/${rawInstagram.replace('@', '').trim()}`;
  const instagramDisplay = rawInstagram.startsWith('http')
    ? rawInstagram
    : (rawInstagram.startsWith('@') ? rawInstagram : `@${rawInstagram.trim()}`);

  const handleOpenEditModal = () => {
    setFormError('');
    setSaveSuccess('');
    setEditFormData({
      name: user?.displayName || deliveryAddress?.name || '',
      email: user?.email || '',
      phone: user?.phoneNumber || deliveryAddress?.phone || '',
      houseNo: deliveryAddress?.houseNo || '',
      street: deliveryAddress?.street || deliveryAddress?.building || '',
      city: deliveryAddress?.city || deliveryAddress?.district || '',
      state: deliveryAddress?.state || '',
      pincode: deliveryAddress?.pincode || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaveSuccess('');

    const name = editFormData.name.trim();
    const email = editFormData.email.trim();
    const phone = editFormData.phone.trim();
    const houseNo = editFormData.houseNo.trim();
    const street = editFormData.street.trim();
    const city = editFormData.city.trim();
    const state = editFormData.state.trim();
    const pincode = editFormData.pincode.trim();

    if (!name) {
      setFormError("Full Name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const phoneDigitsCount = phone.replace(/\D/g, '');
    if (!phone || phoneDigitsCount.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!houseNo) {
      setFormError("House Number / Flat Number is required.");
      return;
    }

    if (!street) {
      setFormError("Street / Address is required.");
      return;
    }

    if (!city) {
      setFormError("City is required.");
      return;
    }

    if (!state) {
      setFormError("State is required.");
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setFormError("Please enter a valid 6-digit Pincode / ZIP Code.");
      return;
    }

    setIsSavingProfile(true);

    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name,
          email,
          phone,
          houseNo,
          street,
          city,
          state,
          pincode
        });
      }

      setSaveSuccess("Profile updated successfully.");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess('');
      }, 1200);
    } catch (err) {
      console.error("Error updating profile:", err);
      setFormError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return <div className="account-page animate-fade-in container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="account-page animate-fade-in">
        <div className="container" style={{ paddingBottom: '100px', paddingTop: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <Login embedded={true} />
        </div>
        <Footer />
      </div>
    );
  }

  // Format delivery address string safely
  const formattedAddress = deliveryAddress
    ? [
        deliveryAddress.houseNo ? `#${deliveryAddress.houseNo}` : '',
        deliveryAddress.building && deliveryAddress.building !== deliveryAddress.houseNo ? deliveryAddress.building : '',
        deliveryAddress.street,
        deliveryAddress.area && deliveryAddress.area !== deliveryAddress.street ? deliveryAddress.area : '',
        deliveryAddress.landmark ? `(Near ${deliveryAddress.landmark})` : '',
        deliveryAddress.city || deliveryAddress.district,
        deliveryAddress.state,
        deliveryAddress.pincode ? `- ${deliveryAddress.pincode}` : ''
      ].filter(Boolean).join(', ')
    : 'No address saved yet.';

  return (
    <div className="account-page animate-fade-in">
      <div className="container" style={{ paddingBottom: '100px', paddingTop: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* VIEW 1: MY ORDERS VIEW */}
        {isOrdersView ? (
          <div className="animate-fade-in">
            <CustomerOrdersView user={user} onNavigateToShop={() => navigate('/')} />
          </div>
        ) : (
          /* VIEW 2: MY PROFILE VIEW */
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* PROFILE CARD */}
            <div className="profile-card card" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
              <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary, #4F46E5)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
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
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    {user.displayName || deliveryAddress?.name || 'Valued Customer'}
                  </h3>
                </div>
              </div>

              {/* MY PROFILE DETAILS HEADER WITH EDIT PROFILE BUTTON */}
              <div style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                    MY PROFILE
                  </h5>
                  <button 
                    onClick={handleOpenEditModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'var(--primary, #4F46E5)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                </div>

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.15rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Shipping / Delivery Address</span>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.4' }}>
                    {formattedAddress}
                  </p>
                </div>
              </div>

              {/* STORE / CUSTOMER SUPPORT CONTACT INFORMATION */}
              <div style={{ marginTop: '0.5rem', paddingTop: '1.1rem', borderTop: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                  CUSTOMER SUPPORT / CONTACT
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {/* Mobile / Call */}
                  <a 
                    href={callUrl} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A' }}
                  >
                    <Phone size={18} color="var(--primary, #4F46E5)" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>Mobile / Call</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{callFormattedDisplay}</div>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a 
                    href={whatsappUrl} 
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
                    href={emailUrl} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A' }}
                  >
                    <Mail size={18} color="#2563EB" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>Email</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, wordBreak: 'break-all' }}>{emailAddress}</div>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a 
                    href={instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FDF2F8', borderRadius: '10px', border: '1px solid #FCE7F3', textDecoration: 'none', color: '#9D174D' }}
                  >
                    <InstagramIcon size={18} color="#DB2777" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#BE185D', fontWeight: 700 }}>Instagram</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{instagramDisplay}</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* LOGOUT BUTTON */}
              <button onClick={logout} className="btn-outline logout-btn-full" style={{ borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, width: '100%' }}>
                <LogOut size={16} /> Logout Account
              </button>
            </div>

          </div>
        )}

        {/* EDIT PROFILE MODAL OVERLAY */}
        {isEditModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>Edit Profile Information</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>Update your personal and delivery details</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', borderRadius: '50%' }}
                >
                  <X size={20} />
                </button>
              </div>

              {saveSuccess && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} color="#22C55E" />
                  {saveSuccess}
                </div>
              )}

              {formError && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={editFormData.name} 
                    onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      Email Address <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="email" 
                      value={editFormData.email} 
                      onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="name@example.com"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={editFormData.phone} 
                      onChange={e => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      House Number / Flat Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.houseNo} 
                      onChange={e => setEditFormData(prev => ({ ...prev, houseNo: e.target.value }))}
                      placeholder="e.g. Door / Flat No 12"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      Street / Address <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.street} 
                      onChange={e => setEditFormData(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="e.g. MG Road, Near Park"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      City <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.city} 
                      onChange={e => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      State <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.state} 
                      onChange={e => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                      Pincode <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editFormData.pincode} 
                      onChange={e => setEditFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="6 digits"
                      maxLength={6}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingProfile}
                    style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary, #4F46E5)', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default Account;

import React, { useContext, useState, useEffect } from 'react';
import { Package, ChevronRight, Phone, Mail, LogOut, User, MessageSquare } from 'lucide-react';
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
  const { user, loading, logout, deliveryAddress, storeSettings } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Read tab parameter from URL query string (e.g., /account?tab=orders vs /account?tab=profile)
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'profile' ? 'profile' : 'orders';

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'orders'
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'profile') {
      setActiveTab('profile');
    } else if (tabParam === 'orders') {
      setActiveTab('orders');
    }
  }, [location.search]);

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
        deliveryAddress.building,
        deliveryAddress.street,
        deliveryAddress.area,
        deliveryAddress.landmark ? `(Near ${deliveryAddress.landmark})` : '',
        deliveryAddress.district,
        deliveryAddress.state,
        deliveryAddress.pincode ? `- ${deliveryAddress.pincode}` : ''
      ].filter(Boolean).join(', ')
    : 'No address saved yet.';

  return (
    <div className="account-page animate-fade-in">
      <div className="container" style={{ paddingBottom: '100px', paddingTop: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* TOP TAB NAVIGATION BAR */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: '#F1F5F9', padding: '0.35rem', borderRadius: '14px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'profile' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'profile' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'profile' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={18} /> My Profile
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'orders' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'orders' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'orders' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Package size={18} /> My Orders
          </button>
        </div>

        {/* TAB 1: MY PROFILE VIEW */}
        {activeTab === 'profile' && (
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

              {/* MY PROFILE DETAILS */}
              <div style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                  MY PROFILE
                </h5>

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
                  {/* Mobile */}
                  <a 
                    href={`tel:${storeSettings?.whatsapp || '+918925325330'}`} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', textDecoration: 'none', color: '#0F172A' }}
                  >
                    <Phone size={18} color="var(--primary, #4F46E5)" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>Mobile / Call</div>
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

              {/* NAVIGATION LINK TO MY ORDERS */}
              <div 
                onClick={() => setActiveTab('orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.1rem',
                  backgroundColor: '#F3E8FF',
                  borderRadius: '12px',
                  border: '1px solid #E9D5FF',
                  cursor: 'pointer',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Package size={22} color="#9333EA" />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#581C87' }}>MY ORDERS</div>
                    <div style={{ fontSize: '0.78rem', color: '#7E22CE' }}>View your complete order history</div>
                  </div>
                </div>
                <ChevronRight size={20} color="#7E22CE" />
              </div>

              <button onClick={logout} className="btn-outline logout-btn-full" style={{ borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, width: '100%' }}>
                <LogOut size={16} /> Logout Account
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: MY ORDERS VIEW (STRICT SEPARATION: ZERO PROFILE INFO, ZERO STORE CONTACT INFO) */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <CustomerOrdersView user={user} onNavigateToShop={() => navigate('/')} />
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default Account;

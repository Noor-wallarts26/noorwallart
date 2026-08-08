import React, { useContext, useState } from 'react';
import { Package, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import CustomerOrdersView from '../components/CustomerOrdersView';

const Account = () => {
  const { user, loading, logout } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [expandedSection, setExpandedSection] = useState('orders'); // 'orders' | null
  const [avatarError, setAvatarError] = useState(false);

  const toggleSection = (section) => {
    if (!user && section !== null) {
      alert("Please login first to view this section.");
      return;
    }
    setExpandedSection(prev => prev === section ? null : section);
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
              <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    {user.displayName || 'Valued Customer'}
                  </h3>
                </div>
              </div>

              {/* MY PROFILE DETAILS */}
              <div style={{ width: '100%', backgroundColor: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                  My Profile
                </h5>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Name</span>
                  <strong style={{ color: '#0F172A' }}>{user.displayName || 'Customer'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Email</span>
                  <strong style={{ color: '#0F172A' }}>{user.email || 'Not provided'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile Number</span>
                  <strong style={{ color: '#0F172A' }}>{user.phoneNumber || 'Not provided'}</strong>
                </div>
              </div>

              <button onClick={logout} className="btn-outline logout-btn-full" style={{ borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, width: '100%' }}>
                <LogOut size={16} /> Logout Account
              </button>
            </div>
          )}
        </div>

        {/* Menu Cards: ONE My Orders Option */}
        {user && (
          <div className="account-menu-card card" style={{ marginTop: '1.25rem' }}>
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
                <div className="menu-expanded-content" style={{ paddingTop: '1rem' }}>
                  <CustomerOrdersView user={user} onNavigateToShop={() => navigate('/')} />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default Account;

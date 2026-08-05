import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Wrench, Shield, MessageCircle, Mail } from 'lucide-react';

const MaintenanceGuard = ({ children }) => {
  const { storeSettings } = useContext(ShopContext);

  // Check if hash location is admin path
  const hash = window.location.hash || '';
  const isAdminPath = hash.startsWith('#/admin');

  if (storeSettings?.maintenanceMode && !isAdminPath) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          maxWidth: '550px',
          width: '100%',
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '3rem 2rem',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '2px solid #F59E0B'
          }}>
            <Wrench size={40} />
          </div>

          <img 
            src={storeSettings.logoUrl || "/logo.jpg"} 
            alt="Logo" 
            style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid #D4AF37' }} 
            onError={(e) => { e.target.src = '/logo.jpg'; }}
          />

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: '#FFF' }}>
            Store Under Maintenance
          </h1>
          
          <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            We are currently upgrading our store to bring you an extraordinary shopping experience. 
            <strong>Noor WallArts & Gifts</strong> will be back online shortly!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a 
              href={`https://wa.me/918925325330?text=${encodeURIComponent("Hello Noor WallArts, I need assistance while website is under maintenance.")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#25D366',
                color: '#FFF',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.95rem'
              }}
            >
              <MessageCircle size={20} /> Contact Support on WhatsApp
            </a>

            <a 
              href="#/admin" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.875rem',
                border: '1px solid #475569'
              }}
            >
              <Shield size={16} /> Admin Portal Access
            </a>
          </div>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748B' }}>
          &copy; {new Date().getFullYear()} Noor WallArts & Gifts. All Rights Reserved.
        </p>
      </div>
    );
  }

  return children;
};

export default MaintenanceGuard;

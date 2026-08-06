import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Wrench, MessageCircle } from 'lucide-react';

const MaintenanceGuard = ({ children }) => {
  const { storeSettings } = useContext(ShopContext);

  const rawWhatsapp = storeSettings?.whatsapp || '8925325330';
  const cleanPhone = String(rawWhatsapp).replace(/\D/g, '');
  const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Noor WallArts & Gifts, I need assistance while the store is under maintenance.")}`;

  if (storeSettings?.maintenanceMode) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        textAlign: 'center',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#1E293B',
          borderRadius: '20px',
          padding: '3rem 2rem',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
        }}>
          {/* Maintenance Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '2px solid rgba(245, 158, 11, 0.4)'
          }}>
            <Wrench size={38} />
          </div>

          {/* Store Logo */}
          <img 
            src={storeSettings?.logoUrl || "/logo.jpg"} 
            alt="Noor WallArts & Gifts" 
            style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '1.25rem', border: '2px solid #D4AF37', objectFit: 'cover' }} 
            onError={(e) => { e.target.src = '/logo.jpg'; }}
          />

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Store Under Maintenance
          </h1>
          
          <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            We're currently updating and improving our store to provide a better shopping experience. We'll be back online soon. Thank you for your patience.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                transition: 'transform 0.2s, background-color 0.2s'
              }}
            >
              <MessageCircle size={22} />
              Need help? Contact Support on WhatsApp
            </a>
          </div>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#64748B' }}>
          &copy; {new Date().getFullYear()} Noor WallArts & Gifts. All rights reserved.
        </p>
      </div>
    );
  }

  return children;
};

export default MaintenanceGuard;

import React from 'react';
import { Wrench, MessageCircle, Mail, Clock } from 'lucide-react';

const Maintenance = ({ storeSettings }) => {
  const whatsappNumber = storeSettings?.whatsapp || '8925325330';
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent("Hello Noor Wall Arts! I noticed the site is under maintenance. I would like to inquire about...")}`;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justify: 'center',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '550px',
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: '24px',
        padding: '3rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          color: '#D4AF37',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <Wrench size={40} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#FFF' }}>
          We'll Be Back Soon!
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
          Our website is currently undergoing scheduled maintenance to bring you an even better experience. Thank you for your patience!
        </p>

        <div style={{
          backgroundColor: '#0F172A',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'left',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem' }}>
            <Clock size={18} /> Need Urgent Help or Custom Orders?
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.5' }}>
            You can still get in touch with our team directly on WhatsApp for orders, support, and inquiries.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '0.75rem',
              backgroundColor: '#25D366',
              color: '#FFF',
              padding: '0.9rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '1rem',
              transition: 'transform 0.2s'
            }}
          >
            <MessageCircle size={22} /> Contact Us on WhatsApp
          </a>

          {storeSettings?.email && (
            <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> {storeSettings.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

import React, { useContext } from 'react';
import { MessageCircle, Mail, Camera, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import './StoreInfo.css';

const StoreInfo = () => {
  const navigate = useNavigate();
  const { storeSettings } = useContext(ShopContext);

  const rawWhatsapp = storeSettings?.whatsapp || '8925325330';
  const cleanWhatsapp = (rawWhatsapp === '8525325330') ? '8925325330' : rawWhatsapp;
  const whatsapp = cleanWhatsapp.replace(/\D/g, '');
  const email = storeSettings?.email || 'noorwallartsofficial@gmail.com';
  const instagram = storeSettings?.instagram || 'noor.wallarts';

  return (
    <div className="store-info-page animate-fade-in container">
      <div className="back-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
      </div>

      <div className="store-info-header">
        <img src="/logo.jpg" alt="Noor Wall Arts Logo" className="store-logo-large" />
        <h2>Noor Wall Arts</h2>
      </div>

      <div className="store-info-content">
        <section className="info-section">
          <h3>Store Contact Details</h3>
          <div className="social-cards">
            <a 
              href={`https://wa.me/${whatsapp.length === 10 ? '91' + whatsapp : whatsapp}?text=${encodeURIComponent("Hello Noor Wall Arts! I need some help.")}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-card whatsapp-card"
            >
              <MessageCircle size={32} />
              <span>WhatsApp</span>
            </a>
            <a href={`mailto:${email}`} className="social-card email-card">
              <Mail size={32} />
              <span>Email</span>
            </a>
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="social-card insta-card">
              <Camera size={32} />
              <span>Instagram</span>
            </a>
          </div>
        </section>

        <section className="info-section customer-care-section">
          <h3>Customer Care Service</h3>
          <div className="care-list">
            <a href="tel:+918925325330" className="care-item">
              <div className="care-icon"><Phone size={24} /></div>
              <div className="care-details">
                <span className="care-label">Call</span>
                <span className="care-value">+91 8925325330</span>
              </div>
            </a>
            <a href={`mailto:${email}`} className="care-item">
              <div className="care-icon"><Mail size={24} /></div>
              <div className="care-details">
                <span className="care-label">Mail</span>
                <span className="care-value">{email}</span>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StoreInfo;

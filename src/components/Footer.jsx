import React, { useContext } from 'react';
import { Camera, Mail, Phone } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Footer.css';

const Footer = () => {
  const { storeSettings } = useContext(ShopContext);
  
  // Use settings from DB, fallback to defaults
  const whatsapp = storeSettings?.whatsapp || '8525325330';
  const email = storeSettings?.email || 'noorwallartsofficial@gmail.com';
  const instagram = storeSettings?.instagram || '@noor.wallarts';
  
  // Format instagram handle for link (remove @ if present)
  const instaHandle = instagram.startsWith('@') ? instagram.substring(1) : instagram;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.jpg" alt="Noor Wall Arts Logo" className="footer-logo" />
            <p style={{ marginTop: '0.75rem' }}>Premium Wall Art & Decor to bring your walls to life.</p>
          </div>
          
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <a href="tel:+918525325330" target="_blank" rel="noopener noreferrer" className="btn-outline contact-btn" style={{ padding: '0.5rem 1rem', width: 'fit-content' }}>
              <Phone size={18} />
              Call: +91 8525325330
            </a>
            <a href="mailto:noorwallartsofficial@gmail.com" className="btn-outline contact-btn" style={{ padding: '0.5rem 1rem', width: 'fit-content' }}>
              <Mail size={18} />
              Email Us
            </a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Noor Wall Arts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

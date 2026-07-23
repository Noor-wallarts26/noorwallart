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
            <h2>Noor Wallarts</h2>
            <p>Premium Wall Art & Decor to bring your walls to life.</p>
          </div>
          
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <a href={`https://wa.me/91${whatsapp}`} target="_blank" rel="noopener noreferrer" className="contact-link">
              <Phone size={18} />
              +91 {whatsapp}
            </a>
            <a href={`mailto:${email}`} className="contact-link">
              <Mail size={18} />
              {email}
            </a>
            <a href={`https://instagram.com/${instaHandle}`} target="_blank" rel="noopener noreferrer" className="contact-link">
              <Camera size={18} />
              {instagram}
            </a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Noor Wallarts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

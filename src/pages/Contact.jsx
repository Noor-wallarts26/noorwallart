import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page animate-fade-in container">
      <header className="cart-header">
        <h2>Contact Us</h2>
      </header>

      <div className="contact-content card">
        <div className="contact-info-section">
          <h3 className="brand-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Noorwal Arts</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            We're here to help! Whether you have a question about our premium Islamic Wall Arts, need assistance with a customized order, or just want to share feedback, we would love to hear from you.
          </p>

          <div className="contact-methods">
            <a href="tel:+918525325330" target="_blank" rel="noopener noreferrer" className="contact-method-card">
              <div className="contact-icon-circle">
                <Phone size={24} />
              </div>
              <div className="contact-method-text">
                <h4>Call Us</h4>
                <p>+91 8525325330</p>
                <span>Mon-Sat, 9AM to 6PM</span>
              </div>
            </a>

            <a href="mailto:noorwallartsofficial@gmail.com" className="contact-method-card">
              <div className="contact-icon-circle">
                <Mail size={24} />
              </div>
              <div className="contact-method-text">
                <h4>Email Us</h4>
                <p>noorwallartsofficial@gmail.com</p>
                <span>We reply within 24 hours</span>
              </div>
            </a>

            <div className="contact-method-card">
              <div className="contact-icon-circle">
                <MapPin size={24} />
              </div>
              <div className="contact-method-text">
                <h4>Location</h4>
                <p>India</p>
                <span>Premium Delivery Nationwide</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-section">
          <h3>Send us a Message</h3>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="Your Name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Your Email Address" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows="5" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;

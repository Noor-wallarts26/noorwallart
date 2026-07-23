import React from 'react';
import { Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="top-bar">
      <div className="container top-bar-content">
        <div className="top-contact-info">
          <a href="tel:+918525325330" className="top-bar-link">
            <Phone size={14} /> +91 8525325330
          </a>
          <a href="mailto:noorwallartsofficial@gmail.com" className="top-bar-link">
            <Mail size={14} /> noorwallartsofficial@gmail.com
          </a>
        </div>
        <div className="top-bar-links">
          <Link to="/contact">Contact Us</Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

import React from 'react';
import { Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="top-bar">
      <div className="container top-bar-content">
        <div className="top-contact-info">
          {/* Contact info removed as requested */}
        </div>
        <div className="top-bar-links">
          <Link to="/contact">Contact Us</Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

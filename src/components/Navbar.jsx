import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, ShoppingCart, ReceiptText, Sun, Moon, Phone } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
  const { totalItemsInCart, storeSettings } = useContext(ShopContext);
  const location = useLocation();
  const currentPath = location.pathname;
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.body.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Don't show bottom nav on checkout
  if (currentPath === '/checkout') return null;

  return (
    <>
      <nav className="bottom-nav">
        <div className="nav-items">
          <button onClick={toggleTheme} className="nav-item theme-toggle-btn">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
          <Link to="/" className={`nav-item ${currentPath === '/' || currentPath.startsWith('/product') ? 'active' : ''}`}>
            <ShoppingBag size={24} />
            <span>Shop</span>
          </Link>
          <Link to="/wishlist" className={`nav-item ${currentPath === '/wishlist' ? 'active' : ''}`}>
            <Heart size={24} />
            <span>Wishlist</span>
          </Link>
          <Link to="/cart" className={`nav-item ${currentPath === '/cart' ? 'active' : ''}`}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              {totalItemsInCart > 0 && <span className="cart-badge">{totalItemsInCart}</span>}
            </div>
            <span>Cart</span>
          </Link>
          <Link to="/orders" className={`nav-item ${currentPath === '/orders' ? 'active' : ''}`}>
            <ReceiptText size={24} />
            <span>Orders</span>
          </Link>
        </div>
      </nav>

      {storeSettings?.whatsapp && (
        <a 
          href="tel:+918525325330" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="floating-whatsapp"
          title="Call Us"
        >
          <Phone size={28} color="#fff" />
        </a>
      )}
    </>
  );
};

export default Navbar;

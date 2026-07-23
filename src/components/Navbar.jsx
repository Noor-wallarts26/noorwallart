import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, ShoppingCart, ReceiptText, Sun, Moon, Phone } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
  const { totalItemsInCart, storeSettings } = useContext(ShopContext);
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show bottom nav on checkout
  if (currentPath === '/checkout') return null;

  return (
    <>
      <nav className="bottom-nav">
        <div className="nav-items">
          <Link to="/" className={`nav-item ${currentPath === '/' && location.hash !== '#categories' ? 'active' : ''}`}>
            <ShoppingBag size={24} />
            <span>Home</span>
          </Link>
          <Link to="/categories" className={`nav-item ${currentPath === '/categories' ? 'active' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Categories</span>
          </Link>
          <Link to="/cart" className={`nav-item ${currentPath === '/cart' ? 'active' : ''}`}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              {totalItemsInCart > 0 && <span className="cart-badge">{totalItemsInCart}</span>}
            </div>
            <span>Cart</span>
          </Link>
          <Link to="/wishlist" className={`nav-item ${currentPath === '/wishlist' ? 'active' : ''}`}>
            <Heart size={24} />
            <span>Favorites</span>
          </Link>
          <Link to="/account" className={`nav-item ${currentPath === '/account' ? 'active' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Account</span>
          </Link>
        </div>
      </nav>

    </>
  );
};

export default Navbar;

import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, ShoppingCart, Package } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
  const { totalItemsInCart, storeSettings } = useContext(ShopContext);
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show bottom nav on checkout
  if (currentPath === '/checkout') return null;

  const isMyOrdersActive = currentPath === '/account' && (location.search.includes('tab=orders') || !location.search.includes('tab=profile'));

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
          <Link to="/account?tab=orders" className={`nav-item ${isMyOrdersActive ? 'active' : ''}`}>
            <Package size={24} />
            <span>My Orders</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

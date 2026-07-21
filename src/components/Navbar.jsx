import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, ShoppingCart, ReceiptText } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
  const { totalItemsInCart } = useContext(ShopContext);
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show bottom nav on checkout
  if (currentPath === '/checkout') return null;

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
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
  );
};

export default Navbar;

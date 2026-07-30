import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const { wishlistedProducts } = useContext(ShopContext);
  const navigate = useNavigate();

  return (
    <div className="wishlist-page animate-fade-in container">
      <header className="cart-header">
        <h2>Your Wishlist</h2>
        <span className="cart-item-count">{wishlistedProducts.length} Items</span>
      </header>

      {wishlistedProducts.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} color="var(--text-secondary)" />
          <p>Your wishlist is empty. Save your favorite items here!</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/')}>Explore Shop</button>
        </div>
      ) : (
        <div className="products-grid">
          {wishlistedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

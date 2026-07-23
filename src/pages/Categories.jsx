import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import './Categories.css';
import Footer from '../components/Footer';

const categoriesList = [
  "All", 
  "Islamic wall arts", 
  "Customized Frames", 
  "Wedding and nikkah collections", 
  "Customized Gifts", 
  "Acrylic & Glass works", 
  "Home decor", 
  "Wall stickers & Decals", 
  "Custom printing", 
  "Corporate and event products", 
  "Personalized products"
];

const Categories = () => {
  const { setSelectedCategory } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    navigate('/');
  };

  return (
    <div className="categories-page animate-fade-in">
      <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '100px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Explore Categories
        </h2>
        
        <div className="categories-grid">
          {categoriesList.map((cat, index) => (
            <button 
              key={index}
              className="category-card"
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="category-card-content">
                <h3>{cat}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;

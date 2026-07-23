import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, PackageCheck, MapPin, Phone, Mail, LogOut } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Account.css';
import Footer from '../components/Footer';
import Login from './Login';

const Account = () => {
  const { orders, user, loading, logout, deliveryAddress, setDeliveryAddress } = useContext(ShopContext);
  const navigate = useNavigate();
  const [addressInput, setAddressInput] = useState(deliveryAddress || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveAddress = () => {
    setDeliveryAddress(addressInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (loading) {
    return <div className="account-page animate-fade-in container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="account-page animate-fade-in">
      <div className="container" style={{ paddingBottom: '100px' }}>
        
        <header className="account-header">
          <h2>My Account</h2>
          <button onClick={logout} className="btn-outline logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </header>

        {/* Delivery Address Section */}
        <section className="account-section card">
          <div className="section-title">
            <MapPin size={20} color="var(--primary)" />
            <h3>Delivery Address</h3>
          </div>
          <div className="address-form">
            <textarea 
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter your full delivery address..."
              rows="3"
              className="address-textarea"
            />
            <div className="address-actions">
              <button onClick={handleSaveAddress} className="btn-primary save-btn">
                Save Address
              </button>
              {isSaved && <span className="save-success">Address Saved!</span>}
            </div>
          </div>
        </section>

        {/* My Orders Section */}
        <section className="account-section card">
          <div className="section-title">
            <PackageCheck size={20} color="var(--primary)" />
            <h3>My Orders ({orders.length})</h3>
          </div>
          
          {orders.length === 0 ? (
            <div className="empty-state">
              <ReceiptText size={48} color="var(--text-secondary)" />
              <p>You haven't placed any orders yet.</p>
              <button className="btn-primary mt-4" onClick={() => navigate('/')}>Start Shopping</button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => {
                const date = new Date(order.timestamp).toLocaleString();
                return (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div>
                        <span className="order-status"><PackageCheck size={14} /> {order.status}</span>
                        <p className="order-date">{date}</p>
                      </div>
                      <div className="order-total">
                        ₹{order.totalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="order-body">
                      <p className="order-id">Order #{order.id}</p>
                      <p className="order-summary">{order.itemsSummary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Store Contact Info Section */}
        <section className="account-section card contact-section">
          <div className="section-title">
            <Phone size={20} color="var(--primary)" />
            <h3>Store Contact Info</h3>
          </div>
          <div className="contact-grid">
            <a href="https://wa.me/918925325330" target="_blank" rel="noreferrer" className="contact-card whatsapp">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">WhatsApp</span>
                <span className="contact-value">+91 8925325330</span>
              </div>
            </a>
            
            <a href="mailto:noorwallartsofficial@gmail.com" className="contact-card email">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <div className="contact-details">
                <span className="contact-label">Email Us</span>
                <span className="contact-value" style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>noorwallartsofficial@gmail.com</span>
              </div>
            </a>

            <a href="https://instagram.com/noor.wallarts" target="_blank" rel="noreferrer" className="contact-card instagram">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Instagram</span>
                <span className="contact-value">@noor.wallarts</span>
              </div>
            </a>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
};

export default Account;

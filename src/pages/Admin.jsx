import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, SlidersHorizontal, AlertCircle, ShoppingBag, CheckCircle, Clock, Truck } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { products, updateProductSliderStatus, fetchAllOrders, updateOrderStatus, updateProductDeliveryCharge } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(null); // track which product is updating
  
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [orderMessages, setOrderMessages] = useState({});
  const [orderStatuses, setOrderStatuses] = useState({});

  useEffect(() => {
    const loadOrders = async () => {
      setIsOrdersLoading(true);
      const fetched = await fetchAllOrders();
      setOrders(fetched);
      
      const initialMsgs = {};
      const initialSts = {};
      fetched.forEach(o => {
        initialMsgs[o.id] = o.adminMessage || '';
        initialSts[o.id] = o.status || 'Pending';
      });
      setOrderMessages(initialMsgs);
      setOrderStatuses(initialSts);
      
      setIsOrdersLoading(false);
    };
    loadOrders();
  }, [fetchAllOrders]);

  const handleUpdateOrder = async (orderId) => {
    const status = orderStatuses[orderId];
    const msg = orderMessages[orderId];
    const success = await updateOrderStatus(orderId, status, msg);
    if (success) {
      alert("Order updated successfully!");
    } else {
      alert("Failed to update order.");
    }
  };

  const sliderCount = products.filter(p => p.showInSlider).length;

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSlider = async (productId, currentStatus) => {
    // If trying to add, but we already have 10, prevent it
    if (!currentStatus && sliderCount >= 10) {
      alert("You can only select up to 10 products for the slider.");
      return;
    }
    
    setIsUpdating(productId);
    await updateProductSliderStatus(productId, !currentStatus);
    setIsUpdating(null);
  };

  return (
    <div className="admin-page animate-fade-in container">
      <header className="admin-header">
        <div className="admin-logo-wrapper">
          <img src="/logo.jpg" alt="Admin Logo" className="admin-logo" />
          <span className="admin-logo-text">Admin</span>
        </div>
        <h1>Admin Control Panel</h1>
        <p>Manage your website content and settings</p>
      </header>

      <section className="admin-section">
        <div className="section-header">
          <div className="section-title">
            <SlidersHorizontal size={24} color="var(--primary)" />
            <h2>Hero Slider Control</h2>
          </div>
          <span className={`slider-count-badge ${sliderCount >= 10 ? 'max-reached' : ''}`}>
            {sliderCount} / 10 Selected
          </span>
        </div>
        
        <p className="section-description">
          Choose up to 10 products to display in the main sliding banner on the home page.
        </p>

        {sliderCount === 0 && (
          <div className="admin-alert">
            <AlertCircle size={18} />
            <span>Currently no products are selected. The system is showing 10 recent products as a fallback.</span>
          </div>
        )}

        <div className="admin-search">
          <Search size={20} className="search-icon" color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search products to add to slider..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-product-list">
          {filteredProducts.map(product => (
            <div key={product.id} className={`admin-product-item ${product.showInSlider ? 'selected-for-slider' : ''}`}>
              <div className="product-item-info">
                <div 
                  className="product-item-image"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                >
                  {!product.imageUrl && <span style={{fontSize: '10px'}}>{product.title}</span>}
                </div>
                <div className="product-item-details">
                  <h4>{product.title}</h4>
                  <span>₹{product.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="product-item-action" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Delivery Fee</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>₹</span>
                    <input 
                      type="number" 
                      defaultValue={product.deliveryCharge !== undefined ? product.deliveryCharge : 80}
                      onBlur={(e) => {
                        const newCharge = e.target.value;
                        if (newCharge !== '' && Number(newCharge) >= 0) {
                          updateProductDeliveryCharge(product.id, newCharge);
                        }
                      }}
                      disabled={isUpdating === product.id}
                      style={{ width: '70px', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Show in Slider</label>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={product.showInSlider || false}
                      onChange={() => handleToggleSlider(product.id, product.showInSlider)}
                      disabled={isUpdating === product.id}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-admin-list">No products found.</div>
          )}
        </div>
      </section>

      <section className="admin-section" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <div className="section-title">
            <ShoppingBag size={24} color="var(--primary)" />
            <h2>Order Management</h2>
          </div>
        </div>
        
        <p className="section-description">
          View customer orders, update their delivery status, and send custom tracking messages.
        </p>

        {isOrdersLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-admin-list">No orders found.</div>
        ) : (
          <div className="admin-orders-list">
            {orders.map(order => (
              <div key={order.id} className="admin-order-card card">
                <div className="order-card-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Order #{order.id}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    ,1{order.totalPrice.toFixed(2)}
                  </div>
                </div>
                
                <div className="order-customer-details" style={{ margin: '1rem 0', padding: '1rem', background: 'var(--surface-variant)', borderRadius: '8px' }}>
                  <p style={{ marginBottom: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone})
                  </p>
                  
                  <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Door/House No:</span> <br/><strong>{order.customer?.houseNo || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Building Name:</span> <br/><strong>{order.customer?.building || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Street:</span> <br/><strong>{order.customer?.street || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Area:</span> <br/><strong>{order.customer?.area || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Landmark:</span> <br/><strong>{order.customer?.landmark || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>City/District:</span> <br/><strong>{order.customer?.district || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>State:</span> <br/><strong>{order.customer?.state || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Pincode:</span> <br/><strong>{order.customer?.pincode || '-'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Country:</span> <br/><strong>{order.customer?.country || 'India'}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Address Type:</span> <br/><strong>{order.customer?.addressType || 'Home'}</strong></div>
                  </div>

                  {order.customer?.instructions && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Delivery Instructions:</span><br/>
                      <strong>{order.customer.instructions}</strong>
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Items Ordered:</strong> <span style={{ color: 'var(--primary)' }}>{order.itemsSummary}</span></p>
                    <p><strong>Payment:</strong> {order.paymentMethod} {order.transactionId && `(Txn ID: ${order.transactionId})`}</p>
                  </div>
                </div>

                <div className="order-action-controls" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 2fr auto' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Status</label>
                    <select 
                      value={orderStatuses[order.id]} 
                      onChange={(e) => setOrderStatuses(prev => ({...prev, [order.id]: e.target.value}))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Admin Message to Customer</label>
                    <input 
                      type="text" 
                      value={orderMessages[order.id]}
                      onChange={(e) => setOrderMessages(prev => ({...prev, [order.id]: e.target.value}))}
                      placeholder="e.g. Will arrive in 2 days"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleUpdateOrder(order.id)}
                      style={{ padding: '0.6rem 1.5rem', height: 'max-content', borderRadius: '8px' }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Admin;

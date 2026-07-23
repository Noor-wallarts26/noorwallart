import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, PackageCheck } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import './Orders.css';
import Footer from '../components/Footer';

const Orders = () => {
  const { orders } = useContext(ShopContext);
  const navigate = useNavigate();

  return (
    <div className="orders-page animate-fade-in container">
      <header className="cart-header">
        <h2>Order History</h2>
        <span className="cart-item-count">{orders.length} Orders</span>
      </header>

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
              <div key={order.id} className="order-card card">
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
      <Footer />
    </div>
  );
};

export default Orders;

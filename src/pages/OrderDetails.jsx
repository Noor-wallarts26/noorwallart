import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { ArrowLeft, Package, Truck, Clock, CreditCard, User, MapPin } from 'lucide-react';

const formatStatusText = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'cancelled') return 'Order Cancelled';
  if (s === 'delivered') return 'Delivered';
  if (s === 'out for delivery' || s === 'shipped') return 'Out for Delivery';
  if (s === 'packed') return 'Packed';
  if (s === 'processing') return 'Processing';
  if (s === 'accepted') return 'Order Accepted';
  return 'Order Placed';
};

const getStatusColor = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'cancelled') return '#DC2626';
  if (s === 'delivered') return '#16A34A';
  if (s === 'out for delivery' || s === 'shipped') return '#2563EB';
  if (s === 'packed') return '#9333EA';
  if (s === 'processing') return '#D97706';
  if (s === 'accepted') return '#4F46E5';
  return '#B45309';
};

const STATUS_FLOW = ['Ordered', 'Accepted', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const getCurrentStepIndex = (statusStr) => {
  if (!statusStr) return 0;
  const s = statusStr.toLowerCase();
  if (s === 'cancelled') return -1;
  if (s === 'out for delivery') return 4;
  
  if (s === 'pending' || s === 'order placed') return 0;

  const idx = STATUS_FLOW.findIndex(st => st.toLowerCase() === s);
  if (idx !== -1) return idx;
  return 0;
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    const orderRef = doc(db, 'orders', id);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Security check: Ensure the order belongs to this user or phone
        const userPhoneDigits = user.phoneNumber ? String(user.phoneNumber).replace(/\D/g, '').slice(-10) : null;
        const orderPhoneDigits = data.customer?.phone ? String(data.customer.phone).replace(/\D/g, '').slice(-10) : null;
        
        if (data.userId === user.uid || (userPhoneDigits && orderPhoneDigits && userPhoneDigits === orderPhoneDigits)) {
          setOrder({ id: docSnap.id, ...data });
        } else {
          setError('You do not have permission to view this order.');
        }
      } else {
        setError('Order not found.');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', minHeight: '60vh' }}>
        <Clock className="animate-spin" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary, #4F46E5)' }} />
        <h2 style={{ fontSize: '1.2rem', color: '#0F172A' }}>Loading Order Details...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', minHeight: '60vh' }}>
        <Package size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.5rem', color: '#0F172A', marginBottom: '1rem' }}>{error}</h2>
        <button onClick={() => navigate('/account?tab=orders')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
          Back to My Orders
        </button>
      </div>
    );
  }

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [{
    title: order.productTitle || 'Ordered Item',
    imageUrl: order.imageUrl || '/logo.jpg',
    price: order.totalPrice || 0,
    quantity: 1,
    productId: order.id
  }];

  const orderNumDisplay = String(order.id).startsWith('#') ? order.id : `#${order.id}`;
  const statusText = formatStatusText(order.status);
  const statusColor = getStatusColor(order.status);
  const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '100px', paddingTop: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/account?tab=orders')}
          style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: '50%' }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Order Details
        </h1>
      </div>

      {/* Main Order Status Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Order ID</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>{orderNumDisplay}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Order Date</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{orderDate}</div>
          </div>
        </div>

        {/* Order Tracking Timeline */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.25rem' }}>Order Timeline</h4>
          {order.status?.toLowerCase() === 'cancelled' ? (
            <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DC2626' }}></div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#DC2626' }}>Order Cancelled</div>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#991B1B', fontSize: '0.9rem' }}>This order has been cancelled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '8px', borderLeft: '2px solid #E2E8F0', marginLeft: '8px' }}>
              {(Array.isArray(order.statusHistory) && order.statusHistory.length > 0 
                  ? order.statusHistory 
                  : [{ status: order.status || 'Ordered', timestamp: order.timestamp, date: order.formattedDate, message: order.adminMessage || 'Status updated.' }]
                ).map((historyEvent, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  const dotColor = isLast ? '#16A34A' : '#94A3B8';
                  return (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', left: '-22px', top: '4px', width: '14px', height: '14px', 
                        borderRadius: '50%', backgroundColor: '#FFFFFF', border: `3px solid ${dotColor}`,
                        boxShadow: isLast ? `0 0 0 3px rgba(22, 163, 74, 0.2)` : 'none'
                      }}></div>
                      <div style={{ marginLeft: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLast ? '#0F172A' : '#475569' }}>
                            {historyEvent.status}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                            {historyEvent.date || (historyEvent.timestamp ? new Date(historyEvent.timestamp).toLocaleString('en-IN') : 'N/A')}
                          </span>
                        </div>
                        {historyEvent.message && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: `2px solid ${isLast ? '#16A34A' : '#CBD5E1'}` }}>
                            {historyEvent.message}
                          </div>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Products List */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} color="var(--primary, #4F46E5)" /> Products Ordered
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item, idx) => {
            const itemPrice = item.price ? Number(item.price) : 0;
            const itemQty = item.quantity ? Number(item.quantity) : 1;
            const itemTotal = itemPrice * itemQty;
            
            return (
              <div key={idx} style={{ display: 'flex', gap: '1rem', paddingBottom: idx !== items.length - 1 ? '1rem' : 0, borderBottom: idx !== items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <img 
                  src={item.imageUrl || '/logo.jpg'} 
                  alt={item.title} 
                  style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} 
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{item.title}</h4>
                  
                  {/* Variants */}
                  <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {item.size && item.size !== 'N/A' && <span>Size: {item.size}</span>}
                    {item.color && item.color !== 'N/A' && <span>Color: {item.color}</span>}
                    {item.variant && item.variant !== 'N/A' && <span>Variant: {item.variant}</span>}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>₹{itemPrice.toLocaleString('en-IN')} x {itemQty}</div>
                    <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 900 }}>₹{itemTotal.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Summary Summary */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} color="var(--primary, #4F46E5)" /> Payment Summary
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 600 }}>
            <span>Subtotal</span>
            <span style={{ color: '#0F172A' }}>₹{Number(order.originalSubtotal || order.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          
          {Number(order.discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
              <span>Discount</span>
              <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 600, paddingBottom: '0.75rem', borderBottom: '1px dashed #CBD5E1' }}>
            <span>Delivery Charge</span>
            <span style={{ color: '#0F172A' }}>+₹{Number(order.deliveryFee || 0).toLocaleString('en-IN')}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>Total Amount</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary, #4F46E5)' }}>₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Payment Method</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{order.paymentMethod || 'Online'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Payment Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: order.paymentStatus === 'Paid' ? '#16A34A' : '#D97706' }}>
              {order.paymentStatus || 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping / Customer Details */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={20} color="var(--primary, #4F46E5)" /> Shipping Details
        </h3>
        
        {order.customer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <User size={18} color="#94A3B8" style={{ marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{order.customer.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{order.customer.phone}</div>
                {order.customer.email && <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{order.customer.email}</div>}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={18} color="#94A3B8" style={{ marginTop: '2px' }} />
              <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, lineHeight: '1.5' }}>
                {[
                  order.customer.houseNo ? `#${order.customer.houseNo}` : '',
                  order.customer.building && order.customer.building !== order.customer.houseNo ? order.customer.building : '',
                  order.customer.street,
                  order.customer.area && order.customer.area !== order.customer.street ? order.customer.area : '',
                  order.customer.landmark ? `(Near ${order.customer.landmark})` : '',
                  order.customer.district || order.customer.city,
                  order.customer.state,
                  order.customer.pincode ? `- ${order.customer.pincode}` : '',
                  order.customer.country || 'India'
                ].filter(Boolean).join(', ')}
              </div>
            </div>
            
            {order.customer.instructions && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid #F59E0B', fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
                <strong>Delivery Instructions:</strong><br/>
                {order.customer.instructions}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#64748B', fontSize: '0.9rem', fontStyle: 'italic' }}>Shipping details not available.</div>
        )}
      </div>

    </div>
  );
};

export default OrderDetails;

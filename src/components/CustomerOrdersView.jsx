import React, { useState, useEffect } from 'react';
import { Package, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeOrder } from '../utils/orderUtils';

const formatStatusText = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'cancelled') return 'Order Cancelled';
  if (s === 'delivered') return 'Delivered';
  if (s === 'shipped') return 'Shipped';
  if (s === 'packed') return 'Packed';
  if (s === 'processing') return 'Processing';
  if (s === 'accepted') return 'Order Accepted';
  return 'Order Placed';
};

const getStatusColor = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'cancelled') return '#DC2626';
  if (s === 'delivered') return '#16A34A';
  if (s === 'shipped') return '#2563EB';
  if (s === 'packed') return '#9333EA';
  if (s === 'processing') return '#D97706';
  if (s === 'accepted') return '#4F46E5';
  return '#B45309';
};

const CustomerOrdersView = ({ user, onNavigateToShop }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for Firestore orders belonging to this customer
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ordersRef = collection(db, "orders");
    const userPhone = user.phoneNumber ? String(user.phoneNumber).replace(/\D/g, '') : null;
    const q = query(ordersRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      if (userPhone && userPhone.length >= 10) {
        const phoneDigits = userPhone.slice(-10);
        getDocs(query(ordersRef, where("customer.phone", "==", phoneDigits))).then(phoneSnap => {
          phoneSnap.forEach(docSnap => {
            if (!fetched.some(o => o.id === docSnap.id)) {
              fetched.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
          processAndSetOrders(fetched);
        }).catch(err => {
          console.error("Phone query error:", err);
          processAndSetOrders(fetched);
        });
      } else {
        processAndSetOrders(fetched);
      }
    }, (error) => {
      console.error("Firestore real-time orders listener error:", error);
      setLoading(false);
    });

    const processAndSetOrders = (rawList) => {
      const sanitizedList = rawList.map(o => sanitizeOrder(o));
      // Sort strictly Newest -> Oldest
      sanitizedList.sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
      setOrders(sanitizedList);
      setLoading(false);
    };

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
        <Clock className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem auto' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          MY ORDERS
        </h2>
        <Package size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem auto' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
          You haven't placed any orders yet
        </h3>
        <button
          onClick={onNavigateToShop}
          className="btn-primary"
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px', marginTop: '1rem' }}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        MY ORDERS
      </h2>

      {orders.map(order => {
        const items = Array.isArray(order.items) && order.items.length > 0
          ? order.items
          : [{
              title: order.productTitle || 'Ordered Item',
              imageUrl: order.imageUrl || '/logo.jpg',
              price: order.totalPrice || 0,
              quantity: 1,
              productId: order.id
            }];

        const orderNumDisplay = String(order.id).startsWith('#') ? order.id : `#${order.id}`;

        return items.map((item, idx) => {
          const itemPrice = item.price ? Number(item.price) : Number(order.totalPrice || 0);
          const itemQty = item.quantity ? Number(item.quantity) : 1;
          const itemTotal = itemPrice * itemQty;
          const productIdDisplay = item.productId || item.id || order.id;

          return (
            <div
              key={`${order.id}-${idx}`}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '1.1rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              {/* 1. PRODUCT IMAGE */}
              <img
                src={item.imageUrl || '/logo.jpg'}
                alt={item.title || 'Product'}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1px solid #E2E8F0',
                  flexShrink: 0
                }}
              />

              {/* PRODUCT DETAILS */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                {/* 2. Product Name */}
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', lineHeight: '1.3' }}>
                  {item.title || 'Product Name'}
                </h4>

                {/* 3. Product ID */}
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                  Product ID: <span style={{ color: '#334155', fontWeight: 700 }}>{productIdDisplay}</span>
                </div>

                {/* 4. Order Number */}
                <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                  Order Number: <span style={{ color: '#334155', fontWeight: 700 }}>{orderNumDisplay}</span>
                </div>

                {/* 5. Amount */}
                <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                  Amount: <span style={{ color: '#0F172A', fontWeight: 800 }}>₹{itemTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* 6. Quantity */}
                <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                  Quantity: <span style={{ color: '#0F172A', fontWeight: 800 }}>{itemQty}</span>
                </div>

                {/* 7. Order Status */}
                <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                  Status: <span style={{ fontWeight: 800, color: getStatusColor(order.status) }}>{formatStatusText(order.status)}</span>
                </div>
              </div>
            </div>
          );
        });
      })}
    </div>
  );
};

export default CustomerOrdersView;

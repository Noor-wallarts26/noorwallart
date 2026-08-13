import React, { useState, useEffect } from 'react';
import { Package, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeOrder } from '../utils/orderUtils';

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

/**
 * Helper: checks if a given order belongs to the current user.
 * Matches by userId (primary), email (secondary), or phone (tertiary).
 */
const orderBelongsToUser = (order, user) => {
  if (!user || !order) return false;

  // 1. Direct userId match (primary — fastest)
  if (order.userId && order.userId === user.uid) return true;

  // 2. Email match (secondary)
  if (user.email && order.customer?.email) {
    if (String(order.customer.email).toLowerCase().trim() === String(user.email).toLowerCase().trim()) {
      return true;
    }
  }

  // 3. Phone match (tertiary)
  const userPhone = user.phoneNumber ? String(user.phoneNumber).replace(/\D/g, '').slice(-10) : null;
  if (userPhone && userPhone.length >= 10 && order.customer?.phone) {
    const orderPhone = String(order.customer.phone).replace(/\D/g, '').slice(-10);
    if (orderPhone === userPhone) return true;
  }

  return false;
};

const CustomerOrdersView = ({ user, onNavigateToShop }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    const ordersRef = collection(db, "orders");

    // Strategy 1: Try real-time listener filtered by userId (works if Firestore rules allow it)
    const q = query(ordersRef, where("userId", "==", user.uid));

    let primarySucceeded = false;
    let unsubscribe = null;

    try {
      unsubscribe = onSnapshot(q, async (snapshot) => {
        primarySucceeded = true;
        let fetched = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Also run fallback queries for orders that may not have userId set
        // but match by email or phone
        const fallbackQueries = [];
        if (user.email) {
          fallbackQueries.push(
            getDocs(query(ordersRef, where("customer.email", "==", user.email)))
              .catch(() => null)
          );
        }
        const userPhone = user.phoneNumber ? String(user.phoneNumber).replace(/\D/g, '') : null;
        if (userPhone && userPhone.length >= 10) {
          const phoneDigits = userPhone.slice(-10);
          fallbackQueries.push(
            getDocs(query(ordersRef, where("customer.phone", "==", phoneDigits)))
              .catch(() => null)
          );
        }

        if (fallbackQueries.length > 0) {
          try {
            const results = await Promise.all(fallbackQueries);
            results.forEach(snap => {
              if (!snap) return;
              snap.forEach(docSnap => {
                if (!fetched.some(o => o.id === docSnap.id)) {
                  fetched.push({ id: docSnap.id, ...docSnap.data() });
                }
              });
            });
          } catch (err) {
            console.warn("Fallback query error (non-fatal):", err);
          }
        }

        processAndSetOrders(fetched);
      }, async (error) => {
        // Strategy 2: If the filtered query fails (e.g. Firestore rules block it),
        // fetch ALL orders and filter client-side — same approach as Admin Panel
        console.warn("Primary userId query failed, using full-collection fallback:", error.message);
        try {
          const allSnapshot = await getDocs(ordersRef);
          const allOrders = allSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          // Filter client-side: only keep orders belonging to this user
          const myOrders = allOrders.filter(order => orderBelongsToUser(order, user));
          processAndSetOrders(myOrders);
        } catch (fallbackError) {
          console.error("Full fallback also failed:", fallbackError);
          setFetchError("Unable to load your orders. Please try again later.");
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Failed to set up orders listener:", err);
      setFetchError("Unable to load your orders. Please try again later.");
      setLoading(false);
    }

    const processAndSetOrders = (rawList) => {
      // Double-check ownership client-side for safety
      const ownedOrders = rawList.filter(order => orderBelongsToUser(order, user));
      const sanitizedList = ownedOrders.map(o => sanitizeOrder(o));
      // Sort strictly Newest -> Oldest
      sanitizedList.sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
      setOrders(sanitizedList);
      setLoading(false);
      setFetchError(null);
    };

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
        <Clock className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem auto' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Loading your orders...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          MY ORDERS
        </h2>
        <p style={{ color: '#991B1B', fontSize: '0.95rem', fontWeight: 600 }}>{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px', marginTop: '1rem' }}
        >
          Retry
        </button>
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
        const totalItems = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
        const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A';

        return (
            <div
              key={order.id}
              onClick={() => navigate(`/order/${order.id}`)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Order ID</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>{orderNumDisplay}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>{orderDate}</div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/invoice-preview/${order.id}`);
                    }}
                    style={{ background: 'none', border: '1px solid #CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.25rem' }}
                  >
                    📄 Invoice
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={items[0]?.imageUrl || '/logo.jpg'} 
                  alt={items[0]?.title || 'Product'} 
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {items[0]?.title || 'Product Name'}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                    {totalItems > 1 ? `+${totalItems - 1} more item${totalItems - 1 > 1 ? 's' : ''}` : `${totalItems} item`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Amount</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary, #4F46E5)' }}>
                    ₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F8FAFC', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(order.status) }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: getStatusColor(order.status) }}>
                      {formatStatusText(order.status)}
                    </span>
                  </div>
                  <ChevronRight size={20} color="#94A3B8" />
                </div>
              </div>
            </div>
        );
      })}
    </div>
  );
};

export default CustomerOrdersView;

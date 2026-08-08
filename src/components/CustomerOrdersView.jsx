import React, { useState, useEffect, useContext } from 'react';
import { Package, Clock, CheckCircle2, Truck, ShoppingBag, ChevronRight, X, AlertCircle, FileText, MapPin, CreditCard, ChevronDown } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeOrder, formatCurrency, formatDate } from '../utils/orderUtils';
import { ShopContext } from '../context/ShopContext';

const ORDER_STEPS = [
  { key: 'Pending', label: 'Order Placed' },
  { key: 'Accepted', label: 'Order Accepted' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Packed', label: 'Packed' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'Delivered', label: 'Delivered' }
];

const getStatusIndex = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'delivered') return 5;
  if (s === 'shipped') return 4;
  if (s === 'packed') return 3;
  if (s === 'processing') return 2;
  if (s === 'accepted') return 1;
  return 0; // Pending
};

const getStatusLabel = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'delivered') return 'Delivered';
  if (s === 'shipped') return 'Shipped';
  if (s === 'packed') return 'Packed';
  if (s === 'processing') return 'Processing';
  if (s === 'accepted') return 'Order Accepted';
  if (s === 'cancelled') return 'Cancelled';
  return 'Order Placed';
};

const getStatusColor = (statusStr) => {
  const s = (statusStr || 'Pending').toLowerCase();
  if (s === 'delivered') return { bg: '#DEF7EC', text: '#03543F', border: '#84E1BC' };
  if (s === 'shipped') return { bg: '#E1EFFE', text: '#1E40AF', border: '#A4CAFE' };
  if (s === 'packed') return { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' };
  if (s === 'processing') return { bg: '#FEF08A', text: '#713F12', border: '#FDE047' };
  if (s === 'accepted') return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
  if (s === 'cancelled') return { bg: '#FDE8E8', text: '#9B1C1C', border: '#F8B4B4' };
  return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
};

const CustomerOrdersView = ({ user, onNavigateToShop }) => {
  const { storeSettings } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Real-time listener for Firestore orders belonging to this customer
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ordersRef = collection(db, "orders");
    // Filter by userId if present, fallback to customer phone
    const userPhone = user.phoneNumber ? String(user.phoneNumber).replace(/\D/g, '') : null;

    const q = query(ordersRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Also check phone match if phone available
      if (userPhone && userPhone.length >= 10) {
        const phoneDigits = userPhone.slice(-10);
        // Query phone matches asynchronously if needed
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
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem auto' }} />
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
        <Package size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem auto' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>You haven't placed any orders yet</h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: '#64748B' }}>Discover our premium wall arts & custom gifts collection today!</p>
        <button
          onClick={onNavigateToShop}
          className="btn-primary"
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px' }}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ORDER CARDS LIST (Newest First) */}
      {orders.map(order => {
        const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
        const currentStepIdx = getStatusIndex(order.status);
        const statusColors = getStatusColor(order.status);
        const totalItems = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);

        return (
          <div
            key={order.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedOrder(order)}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Order #{order.id}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                  {formatDate(order.createdAt || order.timestamp)}
                </div>
              </div>

              {/* Status Badge */}
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isCancelled ? '❌ Cancelled' : getStatusLabel(order.status)}
              </span>
            </div>

            {/* Product Items List Preview */}
            <div style={{ borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '0.85rem 0', margin: '0.5rem 0' }}>
              {Array.isArray(order.items) && order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: idx < order.items.length - 1 ? '0.6rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <img
                      src={item.imageUrl || '/logo.jpg'}
                      alt={item.title}
                      style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </h5>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Card Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Total Amount ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary, #4F46E5)' }}>
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(order);
                }}
                className="btn-outline"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                View Details & Track <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );
      })}

      {/* CONTACT INFORMATION SECTION AFTER OLDEST ORDER */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Contact Us
        </h4>
        <div style={{ fontSize: '0.84rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
          <div>
            Mobile: <a href={`tel:${storeSettings?.whatsapp || '+918925325330'}`} style={{ color: 'var(--primary, #4F46E5)', fontWeight: 700, textDecoration: 'none' }}>{storeSettings?.whatsapp || '+91 89253 25330'}</a>
          </div>
          <div>
            Email: <a href="mailto:noorkarts.in@gmail.com" style={{ color: 'var(--primary, #4F46E5)', fontWeight: 700, textDecoration: 'none' }}>noorkarts.in@gmail.com</a>
          </div>
        </div>
      </div>

      {/* FULL ORDER DETAILS & STEP-BY-STEP TRACKING TIMELINE MODAL */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAF9F6', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                  Order Details #{selectedOrder.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Placed on {formatDate(selectedOrder.createdAt || selectedOrder.timestamp)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.4rem', borderRadius: '8px' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* STEP-BY-STEP TRACKING TIMELINE */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={16} color="var(--primary)" /> Order Tracking Journey
                </h4>

                {(selectedOrder.status || '').toLowerCase() === 'cancelled' ? (
                  <div style={{ backgroundColor: '#FDE8E8', color: '#9B1C1C', padding: '1rem', borderRadius: '10px', border: '1px solid #F8B4B4', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    ❌ Order Cancelled
                    <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: '0.25rem', color: '#B91C1C' }}>
                      This order was cancelled on {formatDate(selectedOrder.updatedAt || selectedOrder.timestamp)}.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '0.5rem' }}>
                    {ORDER_STEPS.map((step, idx) => {
                      const currentIdx = getStatusIndex(selectedOrder.status);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const waHistoryItem = selectedOrder.waHistory?.[step.key];

                      return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                          
                          {/* Step Connector Line */}
                          {idx < ORDER_STEPS.length - 1 && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '24px',
                                bottom: '-16px',
                                width: '2px',
                                backgroundColor: idx < currentIdx ? '#16A34A' : '#E2E8F0',
                                zIndex: 1
                              }}
                            />
                          )}

                          {/* Step Icon Indicator */}
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: isDone ? '#16A34A' : '#FFFFFF',
                              border: `2px solid ${isDone ? '#16A34A' : '#CBD5E1'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isDone ? '#FFFFFF' : '#94A3B8',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              zIndex: 2,
                              flexShrink: 0
                            }}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>

                          {/* Step Text Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: isDone ? 800 : 600, color: isDone ? '#0F172A' : '#94A3B8' }}>
                              {step.label} {isCurrent && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#DEF7EC', color: '#03543F', marginLeft: '0.4rem' }}>Current Status</span>}
                            </div>
                            {isDone && (
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                                {waHistoryItem?.timestamp ? formatDate(waHistoryItem.timestamp) : (idx === 0 ? formatDate(selectedOrder.createdAt || selectedOrder.timestamp) : formatDate(selectedOrder.updatedAt || selectedOrder.timestamp))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ORDERED ITEMS LIST */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <img
                        src={item.imageUrl || '/logo.jpg'}
                        alt={item.title}
                        style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>{item.title}</h5>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A' }}>
                        {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT & FINANCIAL SUMMARY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                    Payment Details
                  </h4>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Method:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedOrder.paymentMethod}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Status:</span>
                      <strong style={{ color: '#16A34A' }}>{selectedOrder.paymentStatus}</strong>
                    </div>
                    {selectedOrder.courier && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px dashed #CBD5E1' }}>
                        <span style={{ color: '#64748B' }}>Courier:</span>
                        <strong style={{ color: '#2563EB' }}>🚚 {selectedOrder.courier}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                    Order Summary
                  </h4>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Delivery Fee:</span>
                      <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '0.5rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: 'var(--primary, #4F46E5)' }}>
                      <span>Grand Total:</span>
                      <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHIPPING ADDRESS */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} /> Delivery Address
                </h4>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedOrder.customer?.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', margin: '0.2rem 0 0.4rem 0' }}>
                  📞 Contact: {selectedOrder.customer?.phone}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                  🏠 {selectedOrder.customer?.fullAddress}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerOrdersView;

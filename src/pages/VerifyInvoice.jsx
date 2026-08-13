import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Clock, Search, ArrowLeft } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';

const VerifyInvoice = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { businessSettings } = useContext(ShopContext);
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        setError('No verification token provided.');
        setLoading(false);
        return;
      }

      try {
        // Try to find by token (which currently might just be the ID)
        // First try direct document ID
        let docSnap = await getDoc(doc(db, 'orders', token));
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          // If not found by ID, try searching by qrVerificationToken field if we add one later
          const q = query(collection(db, 'orders'), where('qrVerificationToken', '==', token));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setOrder({ id: firstDoc.id, ...firstDoc.data() });
          } else {
            setError('Invoice not found or invalid QR code.');
          }
        }
      } catch (err) {
        console.error("Error verifying invoice:", err);
        setError('Failed to verify invoice due to server error.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <Search className="animate-pulse" size={48} color="#4F46E5" />
        <h2 style={{ marginTop: '1.5rem', color: '#0F172A', fontWeight: 600 }}>Verifying Invoice...</h2>
        <p style={{ color: '#64748B', marginTop: '0.5rem' }}>Please wait while we check our secure database.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', padding: '2rem', textAlign: 'center' }}>
        <XCircle size={64} color="#EF4444" style={{ marginBottom: '1rem' }} />
        <h1 style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Verification Failed</h1>
        <p style={{ color: '#64748B', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '2rem' }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Return Home</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        <div style={{ backgroundColor: '#10B981', padding: '2rem', textAlign: 'center', color: '#fff' }}>
          <CheckCircle size={64} style={{ margin: '0 auto 1rem auto' }} />
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Verified Authentic</h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>This invoice was securely issued by {businessSettings.businessName}</p>
        </div>

        <div style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', borderBottom: '2px solid #F1F5F9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            Invoice Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Invoice Number</span>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{order.invoiceNumber || `INV-${order.id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Order Date</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{new Date(order.timestamp).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Billed To</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{order.customer?.name || 'Customer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Total Amount</span>
              <span style={{ color: '#10B981', fontWeight: 900 }}>₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Status</span>
              <span style={{ color: '#0F172A', fontWeight: 700, textTransform: 'capitalize' }}>{order.status || 'Pending'}</span>
            </div>
          </div>

          <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back to Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyInvoice;

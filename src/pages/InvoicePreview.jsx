import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import CustomerInvoice from '../components/Invoice/CustomerInvoice';
import { downloadCustomerInvoice } from '../utils/pdfGenerator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Download, Printer, Clock } from 'lucide-react';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, businessSettings, orders, fetchAllOrders } = useContext(ShopContext);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      // Find in existing user orders
      let foundOrder = orders.find(o => o.id === id);
      
      // If not in standard orders list (maybe admin or deep link), fetch directly
      if (!foundOrder && user) {
        try {
          const docRef = doc(db, 'orders', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Verify ownership if not admin
            if (data.userId === user.uid || user.email === 'admin@noorkarts.in') {
              foundOrder = { id: docSnap.id, ...data };
            }
          }
        } catch (err) {
          console.error("Error fetching order:", err);
        }
      }
      
      setOrder(foundOrder);
      setLoading(false);
    };
    
    if (user) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [id, orders, user]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCustomerInvoice(order, businessSettings);
    } catch (err) {
      alert("Failed to generate invoice PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
        <Clock className="animate-spin" size={32} color="#4F46E5" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
        <h2 style={{ color: '#0F172A', marginBottom: '1rem' }}>Order Not Found or Access Denied</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4F46E5', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#e2e8f0', padding: '2rem 1rem' }}>
      
      {/* Action Bar - Hidden during print */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body, html { background: white !important; margin: 0; padding: 0; }
            .invoice-wrapper { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; }
          }
        `}
      </style>
      
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </button>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={16} /> Print
          </button>
          
          <button onClick={handleDownload} disabled={isDownloading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isDownloading ? 'not-allowed' : 'pointer', opacity: isDownloading ? 0.7 : 1 }}>
            {isDownloading ? <Clock className="animate-spin" size={16} /> : <Download size={16} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="invoice-wrapper" style={{ maxWidth: '794px', margin: '0 auto', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <CustomerInvoice order={order} businessSettings={businessSettings} />
      </div>
      
    </div>
  );
};

export default InvoicePreview;

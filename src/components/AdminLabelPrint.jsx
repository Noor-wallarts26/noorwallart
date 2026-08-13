import React from 'react';
import { Printer, MapPin, Package, Calendar, Phone, FileText } from 'lucide-react';

const AdminLabelPrint = ({ order, onPrintComplete }) => {
  if (!order) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #6B7280)' }}>
        No order details provided for label printing.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
    if (typeof onPrintComplete === 'function') {
      onPrintComplete(order.id);
    }
  };

  const customer = order.customer || {};

  // Address formatting logic
  const streetLine = [customer.houseNo, customer.building, customer.street]
    .filter(Boolean)
    .join(', ');
    
  const landmarkLine = [customer.area, customer.landmark ? `(Near ${customer.landmark})` : '']
    .filter(Boolean)
    .join(', ');

  const cityStateZip = [
    customer.district,
    customer.state,
    customer.pincode ? `- ${customer.pincode}` : ''
  ].filter(Boolean).join(', ');

  const country = customer.country || 'India';
  const instructions = customer.instructions || order.instructions;

  // Items Summary formatting
  const getItemsSummary = () => {
    if (order.itemsSummary) return order.itemsSummary;
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items
        .map(item => `${item.name || item.title || 'Item'} (x${item.quantity || 1})`)
        .join(', ');
    }
    return 'N/A';
  };

  // Date formatting
  const formatDate = (ts) => {
    if (!ts) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (typeof ts === 'object' && ts.toDate) {
      return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (typeof ts === 'object' && ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1rem' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-label, .printable-label * {
            visibility: visible !important;
          }
          .printable-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Action Header / Print Button (Hidden during print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary, #111827)', marginBottom: '0.2rem' }}>Shipping Label</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6B7280)' }}>Order #{order.id}</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary"
          style={{ cursor: 'pointer' }}
        >
          <Printer size={18} />
          Print Label
        </button>
      </div>

      {/* Printable Shipping Label Card */}
      <div
        className="printable-label"
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #111827',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
          color: '#111827',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {/* Header Bar: Brand Logo & Order ID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', margin: 0, color: '#111827' }}>
              NOORWALLART
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '0.15rem', fontWeight: '600' }}>
              EXPRESS SHIPPING LABEL
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280' }}>Order Ref</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827', letterSpacing: '0.5px' }}>
              #{order.id}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              <Calendar size={13} />
              {formatDate(order.timestamp)}
            </div>
          </div>
        </div>

        {/* FROM & TO Addresses Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginBottom: '1.25rem', borderBottom: '1px dashed #D1D5DB', paddingBottom: '1.25rem' }}>
          {/* FROM Section */}
          <div style={{ paddingRight: '1rem', borderRight: '1px dashed #D1D5DB' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              SHIP FROM:
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
              NoorWallArt
            </div>
            <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4', marginTop: '0.2rem' }}>
              Tamil Nadu, India
            </div>
          </div>

          {/* TO Section */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={13} /> SHIP TO:
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827', marginBottom: '0.3rem' }}>
              {customer.name || customer.displayName || 'Valued Customer'}
            </div>
            
            <div style={{ fontSize: '0.9rem', color: '#1F2937', lineHeight: '1.45', fontWeight: '500' }}>
              {streetLine && <div>{streetLine}</div>}
              {landmarkLine && <div>{landmarkLine}</div>}
              {cityStateZip && <div style={{ fontWeight: '600', marginTop: '0.1rem' }}>{cityStateZip}</div>}
              <div style={{ fontWeight: '600' }}>{country}</div>
            </div>

            {(customer.phone || customer.phoneNumber) && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} /> Phone: {customer.phone || customer.phoneNumber}
              </div>
            )}
          </div>
        </div>

        {/* ITEMS Summary */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px dashed #D1D5DB', paddingBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Package size={13} /> PACKAGE CONTENTS:
          </div>
          <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '600', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
            {getItemsSummary()}
          </div>
        </div>

        {/* Instructions / Delivery Note if present */}
        {instructions && (
          <div style={{ marginBottom: '1.25rem', backgroundColor: '#FEF3C7', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #FCD34D' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#92400E', letterSpacing: '0.5px', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FileText size={13} /> DELIVERY INSTRUCTIONS:
            </div>
            <div style={{ fontSize: '0.85rem', color: '#78350F', fontWeight: '600' }}>
              {instructions}
            </div>
          </div>
        )}

        {/* Footer / Total Value */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600' }}>
            Total Value: ₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '500' }}>
            Thank you for shopping with NoorWallArt!
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLabelPrint;

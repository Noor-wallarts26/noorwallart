import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const CustomerInvoice = ({ order, businessSettings }) => {
  if (!order || !businessSettings) return null;

  const invoiceNo = order.invoiceNumber || `INV-${order.id}`;
  const invoiceDate = order.formattedDate || new Date(order.timestamp).toLocaleString('en-IN');
  const qrVerificationUrl = `${window.location.origin}/verify-order/${order.qrVerificationToken || order.id}`;

  const getFullCustomerAddress = (customer) => {
    if (!customer) return 'N/A';
    if (customer.fullAddress && customer.fullAddress !== 'N/A') return customer.fullAddress;
    const parts = [
      customer.houseNo, customer.building, customer.street, customer.area,
      customer.landmark, customer.district || customer.city, customer.state,
      customer.pincode, customer.country || 'India'
    ].filter(val => val && String(val).trim() !== '' && String(val).toLowerCase() !== 'n/a');
    return parts.length > 0 ? parts.join(', ') : (customer.address || 'N/A');
  };

  const customerName = order.customer?.name || 'Customer';
  const customerPhone = order.customer?.phone || 'N/A';
  const customerEmail = order.customer?.email || order.userEmail || 'N/A';
  const shippingAddress = getFullCustomerAddress(order.customer);

  const subtotal = order.originalSubtotal !== undefined ? order.originalSubtotal : order.subtotal;
  const deliveryFee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const totalPrice = order.totalPrice || (subtotal + deliveryFee - discount);

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#111', padding: '40px', boxSizing: 'border-box' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {businessSettings.logoUrl && (
            <img src={businessSettings.logoUrl} alt="Logo" style={{ height: '60px', width: 'auto', borderRadius: '8px' }} crossOrigin="anonymous" />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{businessSettings.businessName}</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>{businessSettings.address}</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569' }}>Phone: {businessSettings.phone} | Email: {businessSettings.email}</p>
            {businessSettings.gstin && <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>GSTIN: {businessSettings.gstin}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '1px' }}>INVOICE</h2>
          <div style={{ marginTop: '10px' }}>
            <QRCodeSVG value={qrVerificationUrl} size={70} />
          </div>
        </div>
      </div>

      {/* INVOICE & CUSTOMER INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ width: '45%' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px' }}>Billed To</h3>
          <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '15px' }}>{customerName}</p>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#334155' }}>{shippingAddress}</p>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#334155' }}>Phone: {customerPhone}</p>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#334155' }}>Email: {customerEmail}</p>
        </div>

        <div style={{ width: '45%' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '10px' }}>Order Details</h3>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              <tr><td style={{ padding: '3px 0', color: '#475569' }}>Invoice No:</td><td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right' }}>{invoiceNo}</td></tr>
              <tr><td style={{ padding: '3px 0', color: '#475569' }}>Order ID:</td><td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right' }}>#{order.id}</td></tr>
              <tr><td style={{ padding: '3px 0', color: '#475569' }}>Order Date:</td><td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right' }}>{invoiceDate}</td></tr>
              <tr><td style={{ padding: '3px 0', color: '#475569' }}>Payment Status:</td><td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: order.paymentStatus === 'Paid' ? '#16a34a' : '#ea580c' }}>{order.paymentStatus || 'Pending'}</td></tr>
              <tr><td style={{ padding: '3px 0', color: '#475569' }}>Payment Method:</td><td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right' }}>{order.paymentMethod || 'Online'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#334155' }}>Item</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>Variant</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>Price</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.imageUrl && <img src={item.imageUrl} alt="prod" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} crossOrigin="anonymous" />}
                <span style={{ fontWeight: '500' }}>{item.title}</span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                {item.size !== 'N/A' && item.size ? `Size: ${item.size}` : ''}
                {item.color !== 'N/A' && item.color ? ` | Color: ${item.color}` : ''}
                {(!item.size || item.size === 'N/A') && (!item.color || item.color === 'N/A') ? '-' : ''}
              </td>
              <td style={{ padding: '12px', textAlign: 'right' }}>₹{(item.originalPrice || item.price).toFixed(2)}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{((item.originalPrice || item.price) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: 'bold' }}>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
              <span style={{ color: '#16a34a' }}>Discount</span>
              <span style={{ fontWeight: 'bold', color: '#16a34a' }}>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Shipping</span>
            <span style={{ fontWeight: 'bold' }}>₹{deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #0f172a', fontSize: '18px', marginTop: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Total Amount</span>
            <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#334155' }}>Thank you for shopping with {businessSettings.businessName}!</p>
        <p style={{ margin: '0 0 4px' }}>{businessSettings.returnPolicy}</p>
        <p style={{ margin: 0 }}>For support, contact {businessSettings.supportNumber} or {businessSettings.email}</p>
      </div>

    </div>
  );
};

export default CustomerInvoice;

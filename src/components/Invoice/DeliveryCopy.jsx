import React from 'react';
import Barcode from 'react-barcode';

const DeliveryCopy = ({ order, businessSettings }) => {
  if (!order || !businessSettings) return null;

  const invoiceNo = order.invoiceNumber || `INV-${order.id}`;
  const invoiceDate = order.formattedDate || new Date(order.timestamp).toLocaleString('en-IN');

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
  const shippingAddress = getFullCustomerAddress(order.customer);

  const subtotal = order.originalSubtotal !== undefined ? order.originalSubtotal : order.subtotal;
  const deliveryFee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const totalPrice = order.totalPrice || (subtotal + deliveryFee - discount);
  const isCOD = order.paymentMethod?.toLowerCase().includes('cash on delivery');

  // We determine package summary
  const totalItems = (order.items || []).reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#111', padding: '40px', boxSizing: 'border-box' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#000' }}>{businessSettings.businessName}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{businessSettings.address}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px' }}>Pickup Contact: {businessSettings.phone}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>DELIVERY SLIP</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Order: #{order.id}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px' }}>Date: {invoiceDate}</p>
        </div>
      </div>

      {/* TRACKING BARCODE */}
      {order.trackingInfo && !order.trackingInfo.startsWith('http') && (
        <div style={{ textAlign: 'center', marginBottom: '30px', padding: '15px', border: '1px dashed #ccc' }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>Tracking Number</p>
          <Barcode value={order.trackingInfo} format="CODE128" width={2} height={50} displayValue={true} />
          {order.courierPartner && <p style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '14px' }}>Courier: {order.courierPartner}</p>}
        </div>
      )}

      {/* SHIPPING TO */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Deliver To</h3>
        <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '18px' }}>{customerName}</p>
        <p style={{ margin: '0 0 4px', fontSize: '15px', lineHeight: '1.4' }}>{shippingAddress}</p>
        <p style={{ margin: '8px 0 0', fontSize: '15px', fontWeight: 'bold' }}>Phone: {customerPhone}</p>
      </div>

      {/* DELIVERY INSTRUCTIONS / COD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ width: '45%', padding: '15px', border: '1px solid #000', backgroundColor: isCOD ? '#fff3cd' : '#d1e7dd' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '10px' }}>Payment Type</h3>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            {isCOD ? 'CASH ON DELIVERY' : 'PREPAID'}
          </p>
          {isCOD && (
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0', color: '#b02a37' }}>
              Collect: ₹{totalPrice.toFixed(2)}
            </p>
          )}
        </div>
        <div style={{ width: '45%', padding: '15px', border: '1px solid #000' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '10px' }}>Package Details</h3>
          <p style={{ fontSize: '14px', margin: '0 0 5px' }}>Total Items: <strong>{totalItems}</strong></p>
          <p style={{ fontSize: '14px', margin: '0 0 5px' }}>Weight: <strong>---</strong></p>
          <p style={{ fontSize: '14px', margin: '0 0 5px' }}>Dimensions: <strong>---</strong></p>
        </div>
      </div>

      {/* ITEMS LIST (Basic) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Product Name</th>
            <th style={{ padding: '8px 0', textAlign: 'center' }}>Variant</th>
            <th style={{ padding: '8px 0', textAlign: 'center' }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px 0', fontWeight: '500' }}>{item.title}</td>
              <td style={{ padding: '10px 0', textAlign: 'center' }}>
                {item.size !== 'N/A' && item.size ? `Size: ${item.size}` : ''}
              </td>
              <td style={{ padding: '10px 0', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #000', paddingTop: '10px', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
        If undelivered, please return to: {businessSettings.businessName}, {businessSettings.address}
      </div>

    </div>
  );
};

export default DeliveryCopy;

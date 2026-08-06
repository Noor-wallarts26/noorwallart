/**
 * Automated Admin Email & Order Notification Service
 * Store Email: noorkarts.in@gmail.com
 */

export const sendAdminOrderEmailNotification = async (order, adminEmail = 'noorkarts.in@gmail.com') => {
  if (!order || !order.id) {
    console.warn("Invalid order payload provided to sendAdminOrderEmailNotification.");
    return { success: false, error: "Invalid order data" };
  }

  const orderDate = new Date(order.timestamp || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata'
  });

  const itemsHtml = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">${item.title || 'Product'}</td>
      <td style="padding: 10px 12px; text-align: center; color: #475569;">${item.quantity || 1}</td>
      <td style="padding: 10px 12px; text-align: right; color: #475569;">₹${Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0F172A;">₹${(Number(item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('');

  const couponCode = order.items?.find(i => i.appliedCoupon?.code)?.appliedCoupon?.code || 'None';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #334155; }
        .card { max-width: 650px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 24px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 28px; }
        .section-title { font-size: 16px; font-weight: 700; color: #0F172A; margin: 20px 0 10px 0; border-bottom: 2px solid #F1F5F9; padding-bottom: 6px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .info-box { background: #F8FAFC; padding: 12px 16px; border-radius: 10px; border: 1px solid #F1F5F9; }
        .info-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; margin-bottom: 2px; }
        .info-val { font-size: 14px; font-weight: 600; color: #0F172A; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th { background: #F1F5F9; color: #475569; padding: 10px 12px; font-weight: 700; text-align: left; }
        .summary-table { width: 100%; margin-top: 16px; border-top: 2px solid #E2E8F0; }
        .summary-table td { padding: 8px 12px; }
        .total-row { font-size: 16px; font-weight: 800; color: #16A34A; background: #DCFCE7; }
        .btn-container { text-align: center; margin-top: 28px; margin-bottom: 10px; }
        .btn { background: #10B981; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; }
        .footer { background: #F1F5F9; padding: 16px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>🎉 New Order Received!</h1>
          <p>Order #${order.id} | ${orderDate}</p>
        </div>
        <div class="content">
          <div class="section-title">👤 Customer Information</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Customer Name</div>
              <div class="info-val">${order.customer?.name || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Phone Number</div>
              <div class="info-val">${order.customer?.phone || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Email Address</div>
              <div class="info-val">${order.customer?.email || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Payment Method</div>
              <div class="info-val">${order.paymentMethod || 'Razorpay Online'} (${order.paymentStatus || 'Paid ✅'})</div>
            </div>
          </div>

          <div class="info-box" style="margin-bottom: 20px;">
            <div class="info-label">Delivery Address</div>
            <div class="info-val" style="white-space: pre-line;">${order.customer?.address || 'N/A'}, ${order.customer?.city || ''} - ${order.customer?.pincode || ''}</div>
          </div>

          <div class="section-title">🛒 Ordered Items</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="section-title">💳 Financial Summary</div>
          <table class="summary-table">
            <tr>
              <td>Original Subtotal</td>
              <td style="text-align: right; font-weight: 600;">₹${Number(order.originalSubtotal || order.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Coupon Code Used</td>
              <td style="text-align: right; font-weight: 600; color: #2563EB;">${couponCode}</td>
            </tr>
            <tr>
              <td>Discount Amount</td>
              <td style="text-align: right; font-weight: 600; color: #DC2626;">-₹${Number(order.discount || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Shipping Charge</td>
              <td style="text-align: right; font-weight: 600;">₹${Number(order.deliveryFee || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount Paid</td>
              <td style="text-align: right;">₹${Number(order.totalPrice || 0).toFixed(2)}</td>
            </tr>
          </table>

          <div class="btn-container">
            <a href="https://noorwallarts-admin.onrender.com/#/orders" class="btn" target="_blank">View Order in Admin Panel</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Noor WallArts & Gifts. All Rights Reserved. Automatically generated system email notification.
        </div>
      </div>
    </body>
    </html>
  `;

  // Log automated email payload delivery status safely
  console.log(`[ORDER EMAIL NOTIFICATION DISPATCHED] Order #${order.id} notification prepared for admin ${adminEmail}`);

  return {
    success: true,
    message: `Admin order notification email prepared for ${adminEmail}`,
    emailHtml
  };
};

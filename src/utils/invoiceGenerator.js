import { sanitizeOrder, formatCurrency, formatDate } from './orderUtils';

/**
 * Company constants for invoices and shipping labels.
 */
const COMPANY_INFO = {
  name: 'NOOR KARTS',
  tagline: 'Premium Arts & Gifts',
  email: 'noorkarts.in@gmail.com',
  phone: '+91 89253 25330',
  website: 'www.noorkarts.in',
  address: 'Noor Karts Studio, Main Road, Chennai, Tamil Nadu - 600001, India'
};

/**
 * Helper to construct customer full address from individual customer fields or fullAddress.
 */
const getFullCustomerAddress = (customer = {}) => {
  if (customer.fullAddress && customer.fullAddress !== 'N/A') {
    return customer.fullAddress;
  }
  const parts = [
    customer.houseNo,
    customer.building,
    customer.street,
    customer.area,
    customer.landmark,
    customer.district || customer.city,
    customer.state,
    customer.pincode,
    customer.country || 'India'
  ].filter(val => val && String(val).trim() !== '' && String(val).toLowerCase() !== 'n/a');

  return parts.length > 0 ? parts.join(', ') : (customer.address || 'N/A');
};

/**
 * Generates a clean HTML document for an order invoice and opens it in a print window.
 *
 * @param {Object} rawOrder - Order object containing id, customer, items, financial totals, etc.
 */
export const generateAndDownloadInvoice = (rawOrder) => {
  if (!rawOrder) return;
  const order = sanitizeOrder(rawOrder);
  
  const formattedDate = formatDate(order.timestamp || Date.now());
  const fullAddress = getFullCustomerAddress(order.customer);

  const subtotal = order.originalSubtotal !== undefined ? order.originalSubtotal : order.subtotal;
  const discount = order.discount || 0;
  const deliveryFee = order.deliveryFee !== undefined ? order.deliveryFee : 0;
  const totalPrice = order.totalPrice !== undefined ? order.totalPrice : 0;

  const itemsRowsHTML = (order.items || []).map((item, index) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQty = parseInt(item.quantity, 10) || 1;
    const itemTotal = itemPrice * itemQty;
    
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <div style="font-weight: bold; color: #000;">${item.title || 'Product Item'}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${itemQty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(itemPrice)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  const invoiceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - ${order.id}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 12mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
      color: #111111;
      padding: 24px;
      line-height: 1.5;
    }

    .no-print-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #111111;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 6px;
    }

    .btn-print {
      background: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-print:hover {
      background: #e5e5e5;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px;
      border: 1px solid #e5e5e5;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000000;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .company-title {
      font-size: 28px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000000;
    }

    .company-tagline {
      font-size: 13px;
      font-style: italic;
      color: #444444;
      margin-top: 2px;
    }

    .invoice-title-box {
      text-align: right;
    }

    .invoice-heading {
      font-size: 26px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000000;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .meta-card {
      border: 1px solid #000000;
      padding: 14px;
      border-radius: 4px;
    }

    .meta-card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 8px;
      color: #000000;
    }

    .meta-row {
      font-size: 13px;
      margin-bottom: 4px;
      color: #111111;
    }

    .meta-row strong {
      color: #000000;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .items-table th {
      background-color: #000000;
      color: #ffffff;
      padding: 10px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #000000;
    }

    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }

    .summary-box {
      width: 320px;
      border: 1px solid #000000;
      padding: 14px;
      border-radius: 4px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
      color: #111111;
    }

    .summary-grand {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 900;
      padding-top: 10px;
      margin-top: 6px;
      border-top: 2px solid #000000;
      color: #000000;
    }

    .footer {
      border-top: 1px solid #000000;
      padding-top: 16px;
      text-align: center;
      font-size: 13px;
      color: #222222;
    }

    .footer-thankyou {
      font-size: 15px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <div class="no-print-bar no-print">
    <div><strong>Invoice Preview</strong> - Order #${order.id}</div>
    <button class="btn-print" onclick="window.print()">Print Invoice</button>
  </div>

  <div class="invoice-container">
    
    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="company-title">${COMPANY_INFO.name}</div>
        <div class="company-tagline">${COMPANY_INFO.tagline}</div>
        <div style="font-size: 12px; color: #444444; margin-top: 6px;">
          Email: ${COMPANY_INFO.email} | Phone: ${COMPANY_INFO.phone}<br />
          Web: ${COMPANY_INFO.website}
        </div>
      </div>
      <div class="invoice-title-box">
        <div class="invoice-heading">TAX INVOICE</div>
        <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">#${order.id}</div>
        <div style="font-size: 12px; color: #444444;">Date: ${formattedDate}</div>
      </div>
    </div>

    <!-- CUSTOMER & PAYMENT DETAILS -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-card-title">Billed & Shipped To</div>
        <div class="meta-row"><strong>Name:</strong> ${order.customer.name || 'Valued Customer'}</div>
        <div class="meta-row"><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</div>
        <div class="meta-row"><strong>Email:</strong> ${order.customer.email || 'N/A'}</div>
        <div class="meta-row"><strong>Address:</strong> ${fullAddress}</div>
      </div>

      <div class="meta-card">
        <div class="meta-card-title">Payment & Order Details</div>
        <div class="meta-row"><strong>Invoice No:</strong> INV-${order.id}</div>
        <div class="meta-row"><strong>Order ID:</strong> ${order.id}</div>
        <div class="meta-row"><strong>Order Date:</strong> ${formattedDate}</div>
        <div class="meta-row"><strong>Order Status:</strong> ${order.status || 'Ordered'}</div>
        <div class="meta-row"><strong>Courier/Shipping Partner:</strong> ${order.courierPartner || 'Not Assigned'}</div>
        <div class="meta-row"><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</div>
        <div class="meta-row"><strong>Payment Status:</strong> ${order.paymentStatus || 'N/A'}</div>
        <div class="meta-row"><strong>Transaction ID:</strong> ${order.transactionId || 'N/A'}</div>
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Product Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 110px; text-align: right;">Unit Price</th>
          <th style="width: 120px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHTML}
      </tbody>
    </table>

    <!-- TOTALS SUMMARY -->
    <div class="summary-container">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="summary-row">
          <span>Discount</span>
          <span>-${formatCurrency(discount)}</span>
        </div>
        ` : ''}
        <div class="summary-row">
          <span>Delivery Fee</span>
          <span>${deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
        </div>
        <div class="summary-grand">
          <span>Grand Total</span>
          <span>${formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-thankyou">Thank you for shopping with NoorWallArt!</div>
      <div>For queries or support, please email us at ${COMPANY_INFO.email} or call ${COMPANY_INFO.phone}.</div>
      <div style="font-size: 11px; color: #666666; margin-top: 8px;">This is a computer-generated invoice. No physical signature required.</div>
    </div>

  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=900,height=950');
  if (printWin) {
    printWin.document.write(invoiceHTML);
    printWin.document.close();
    printWin.focus();
  }
};

/**
 * Generates printable shipping labels for an array of orders in a single print window.
 *
 * @param {Array<Object>|Object} rawOrders - Array of order objects or a single order object.
 */
export const generateBulkShippingLabels = (rawOrders = []) => {
  const orderArray = Array.isArray(rawOrders) ? rawOrders : [rawOrders];
  if (orderArray.length === 0) return;

  const sanitizedOrders = orderArray.map(ord => sanitizeOrder(ord));

  const labelsHTML = sanitizedOrders.map(order => {
    const formattedDate = formatDate(order.timestamp || Date.now());
    const fullAddress = getFullCustomerAddress(order.customer);
    const itemsSummary = (order.items || [])
      .map(i => `${i.title || 'Item'} (x${i.quantity || 1})`)
      .join(', ');

    const isCOD = String(order.paymentMethod || '').toUpperCase().includes('COD');

    return `
      <div class="shipping-label">
        <!-- HEADER -->
        <div class="label-header">
          <div class="label-brand">
            <div class="brand-name">${COMPANY_INFO.name}</div>
            <div class="brand-tagline">${COMPANY_INFO.tagline}</div>
          </div>
          <div class="order-id-badge">
            <div class="order-id-label">ORDER ID</div>
            <div class="order-id-value">#${order.id}</div>
          </div>
        </div>

        <!-- ADDRESS GRID -->
        <div class="address-grid">
          <!-- FROM -->
          <div class="address-box from-box">
            <div class="box-header">FROM (SHIPPER):</div>
            <div class="address-name">${COMPANY_INFO.name}</div>
            <div class="address-detail">${COMPANY_INFO.address}</div>
            <div class="address-phone">Phone: ${COMPANY_INFO.phone}</div>
          </div>

          <!-- TO -->
          <div class="address-box to-box">
            <div class="box-header">TO (RECIPIENT):</div>
            <div class="customer-name">${order.customer.name || 'Valued Customer'}</div>
            <div class="customer-phone">📞 Phone: ${order.customer.phone || 'N/A'}</div>
            <div class="customer-address">${fullAddress}</div>
            <div class="pincode-badge">PIN CODE: ${order.customer.pincode || 'N/A'}</div>
          </div>
        </div>

        <!-- DETAILS BAR -->
        <div class="details-bar">
          <div class="details-item">
            <strong>Date:</strong> ${formattedDate}
          </div>
          <div class="payment-badge ${isCOD ? 'badge-cod' : 'badge-prepaid'}">
            ${isCOD ? `COD: COLLECT ${formatCurrency(order.totalPrice)}` : 'PREPAID - DO NOT COLLECT CASH'}
          </div>
        </div>

        <!-- ITEMS SUMMARY -->
        <div class="items-summary">
          <strong>Items (${order.items.length}):</strong> ${itemsSummary}
        </div>

        <!-- FOOTER / WARNING -->
        <div class="label-footer">
          ⚠️ FRAGILE - ISLAMIC WALL ART - HANDLE WITH CARE
        </div>
      </div>
    `;
  }).join('');

  const bulkHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipping Labels (${sanitizedOrders.length})</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 8mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .shipping-label {
        page-break-inside: avoid;
        margin-bottom: 20px;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f4;
      color: #000000;
      padding: 20px;
    }

    .no-print-bar {
      max-width: 750px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000000;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 6px;
    }

    .btn-print {
      background: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
    }

    .labels-container {
      max-width: 750px;
      margin: 0 auto;
    }

    .shipping-label {
      background: #ffffff;
      border: 2px dashed #000000;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 24px;
      position: relative;
    }

    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .brand-tagline {
      font-size: 11px;
      font-style: italic;
      color: #333333;
    }

    .order-id-badge {
      text-align: right;
    }

    .order-id-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #555555;
    }

    .order-id-value {
      font-size: 20px;
      font-weight: 900;
      color: #000000;
    }

    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 14px;
    }

    .address-box {
      border: 1px solid #000000;
      padding: 12px;
      border-radius: 4px;
      background: #fafafa;
    }

    .to-box {
      background: #ffffff;
      border: 2px solid #000000;
    }

    .box-header {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .address-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .address-detail {
      font-size: 12px;
      line-height: 1.4;
      color: #222222;
    }

    .address-phone {
      font-size: 12px;
      font-weight: bold;
      margin-top: 6px;
    }

    .customer-name {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .customer-phone {
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .customer-address {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .pincode-badge {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      font-size: 14px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .details-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #000000;
      border-bottom: 1px solid #000000;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .payment-badge {
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      font-size: 12px;
    }

    .badge-prepaid {
      background: #000000;
      color: #ffffff;
    }

    .badge-cod {
      background: #000000;
      color: #ffffff;
      border: 2px solid #000000;
    }

    .items-summary {
      font-size: 12px;
      border: 1px solid #000000;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      background: #fafafa;
    }

    .label-footer {
      border: 1px dashed #000000;
      text-align: center;
      padding: 6px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      background: #ffffff;
    }
  </style>
</head>
<body>

  <div class="no-print-bar no-print">
    <div><strong>Print Shipping Labels</strong> (${sanitizedOrders.length} label${sanitizedOrders.length > 1 ? 's' : ''})</div>
    <button class="btn-print" onclick="window.print()">Print Labels</button>
  </div>

  <div class="labels-container">
    ${labelsHTML}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=850,height=950');
  if (printWin) {
    printWin.document.write(bulkHTML);
    printWin.document.close();
    printWin.focus();
  }
};

/**
 * Generates shipping label for a single order or an array of orders.
 *
 * @param {Object|Array<Object>} order - Order object or array of order objects.
 */
export const generateShippingLabel = (order) => {
  if (!order) return;
  if (Array.isArray(order)) {
    return generateBulkShippingLabels(order);
  }
  return generateBulkShippingLabels([order]);
};

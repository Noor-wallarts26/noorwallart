import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import CustomerInvoice from '../components/Invoice/CustomerInvoice';
import DeliveryCopy from '../components/Invoice/DeliveryCopy';

const generatePDF = async (Component, props, filename) => {
  // 1. Create a hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  // 2. Render the React component into the container
  const root = createRoot(container);
  
  return new Promise((resolve, reject) => {
    // We need to wait for the component to mount and any images/QR codes to render
    root.render(
      <div id="pdf-content-wrapper" style={{ width: '794px', background: '#fff' }}>
        <Component {...props} />
      </div>
    );

    // Give it a moment to render the DOM and load images
    setTimeout(async () => {
      try {
        const element = document.getElementById('pdf-content-wrapper');
        if (!element) throw new Error("Content not found");

        const canvas = await html2canvas(element, {
          scale: 2, // Higher scale for better resolution
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 size: 210 x 297 mm
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        // Add new pages if content is taller than one A4 page
        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(filename);
        resolve(true);
      } catch (err) {
        console.error("PDF generation failed", err);
        reject(err);
      } finally {
        // 3. Cleanup
        setTimeout(() => {
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }, 100);
      }
    }, 1500); // 1.5 second delay to ensure QR code and images load
  });
};

export const downloadCustomerInvoice = async (order, businessSettings) => {
  const invoiceNo = order.invoiceNumber || `INV-${order.id}`;
  const filename = `${invoiceNo}.pdf`;
  return generatePDF(CustomerInvoice, { order, businessSettings }, filename);
};

export const downloadDeliveryCopy = async (order, businessSettings) => {
  const filename = `Delivery-${order.id}.pdf`;
  return generatePDF(DeliveryCopy, { order, businessSettings }, filename);
};

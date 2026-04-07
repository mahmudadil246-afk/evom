import { jsPDF } from "jspdf";

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
}

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],      // Slate 900
  accent: [59, 130, 246] as [number, number, number],      // Blue 500
  accentLight: [219, 234, 254] as [number, number, number], // Blue 100
  gold: [180, 142, 58] as [number, number, number],         // Warm Gold
  text: [30, 41, 59] as [number, number, number],           // Slate 800
  textMuted: [100, 116, 139] as [number, number, number],   // Slate 500
  textLight: [148, 163, 184] as [number, number, number],   // Slate 400
  border: [226, 232, 240] as [number, number, number],      // Slate 200
  bgLight: [248, 250, 252] as [number, number, number],     // Slate 50
  white: [255, 255, 255] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],       // Green 600
  danger: [220, 38, 38] as [number, number, number],        // Red 600
};

function generateSingleInvoice(doc: jsPDF, data: InvoiceData, startY = 0): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = startY + 5;

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

  // ========== TOP ACCENT BAR ==========
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, startY, pageWidth, 4, "F");

  y = startY + 20;

  // ========== HEADER ==========
  // Store name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.store_name || "YOUR STORE", margin, y);

  // Store info below name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  if (data.store_address) {
    y += 6;
    doc.text(data.store_address, margin, y);
  }
  if (data.store_phone) {
    y += 4;
    doc.text(`Tel: ${data.store_phone}`, margin, y);
  }
  if (data.store_email) {
    y += 4;
    doc.text(data.store_email, margin, y);
  }

  // INVOICE label - right side
  const rightX = pageWidth - margin;
  let headerRightY = startY + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.textLight);
  doc.text("INVOICE", rightX, headerRightY, { align: "right" });

  headerRightY += 10;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(`#INV-${data.order_number}`, rightX, headerRightY, { align: "right" });

  headerRightY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  const invoiceDate = new Date(data.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${invoiceDate}`, rightX, headerRightY, { align: "right" });

  y = Math.max(y, headerRightY) + 16;

  // ========== SEPARATOR ==========
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ========== BILL TO / SHIP TO ==========
  const colWidth = (pageWidth - margin * 2 - 20) / 2;

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accent);
  doc.text("BILL TO", margin, y);

  const billStartY = y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(data.customer_name, margin, billStartY);

  let billY = billStartY + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  if (data.customer_phone) {
    doc.text(data.customer_phone, margin, billY);
    billY += 5;
  }
  if (data.customer_email) {
    doc.text(data.customer_email, margin, billY);
    billY += 5;
  }

  // Ship To
  const shipX = margin + colWidth + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accent);
  doc.text("SHIP TO", shipX, y);

  let shipY = y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(data.customer_name, shipX, shipY);

  shipY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  const addressLines = doc.splitTextToSize(data.shipping_address || "N/A", colWidth - 5);
  addressLines.forEach((line: string) => {
    doc.text(line, shipX, shipY);
    shipY += 5;
  });

  y = Math.max(billY, shipY) + 12;

  // ========== ITEMS TABLE ==========
  // Table header background
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 12, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);

  const col1 = margin + 5;
  const col2 = margin + 95;
  const col3 = margin + 118;
  const col4 = pageWidth - margin - 5;

  doc.text("DESCRIPTION", col1, y + 2);
  doc.text("QTY", col2, y + 2);
  doc.text("UNIT PRICE", col3, y + 2);
  doc.text("AMOUNT", col4, y + 2, { align: "right" });

  y += 14;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.items.forEach((item, index) => {
    // Check page overflow
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 20;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.bgLight);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");
    }

    doc.setTextColor(...COLORS.text);
    const productLines = doc.splitTextToSize(item.product_name, 82);
    doc.text(productLines[0], col1, y);
    
    doc.setTextColor(...COLORS.textMuted);
    doc.text(item.quantity.toString(), col2 + 5, y);
    doc.text(formatCurrency(item.unit_price), col3, y);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(formatCurrency(item.total_price), col4, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    if (productLines.length > 1) {
      for (let i = 1; i < productLines.length; i++) {
        y += 5;
        doc.setTextColor(...COLORS.textMuted);
        doc.text(productLines[i], col1, y);
      }
    }

    y += 10;
  });

  y += 2;

  // ========== TOTALS SECTION ==========
  // Totals box on right side
  const totalsBoxX = pageWidth - margin - 85;
  const totalsBoxWidth = 85;
  
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(totalsBoxX, y - 2, totalsBoxWidth, data.discount > 0 ? 52 : 42, 3, 3, "F");

  const labelX = totalsBoxX + 5;
  const valueX = totalsBoxX + totalsBoxWidth - 5;

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Subtotal", labelX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(data.subtotal), valueX, y, { align: "right" });

  y += 8;
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Shipping", labelX, y);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(data.shipping_cost), valueX, y, { align: "right" });

  if (data.discount > 0) {
    y += 8;
    doc.setTextColor(...COLORS.textMuted);
    doc.text("Discount", labelX, y);
    doc.setTextColor(...COLORS.success);
    doc.text(`-${formatCurrency(data.discount)}`, valueX, y, { align: "right" });
  }

  // Total line separator
  y += 6;
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(1.5);
  doc.line(totalsBoxX + 3, y, totalsBoxX + totalsBoxWidth - 3, y);

  // Grand Total
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text("TOTAL", labelX, y);
  doc.text(formatCurrency(data.total), valueX, y, { align: "right" });

  y += 20;

  // ========== PAYMENT INFO BAR ==========
  doc.setFillColor(...COLORS.accentLight);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 3, 3, "F");

  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Payment Method", margin + 8, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(data.payment_method || "N/A", margin + 50, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Status", pageWidth / 2 + 10, y);
  
  const statusColor = data.payment_status === "paid" ? COLORS.success : 
                       data.payment_status === "failed" ? COLORS.danger : COLORS.gold;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...statusColor);
  doc.text(data.payment_status.toUpperCase(), pageWidth / 2 + 30, y);

  // ========== FOOTER ==========
  y = pageHeight - 30;
  
  // Footer line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFontSize(7);
  doc.text(
    data.store_email || "",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Bottom accent bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();
  generateSingleInvoice(doc, data);
  doc.save(`Invoice-${data.order_number}.pdf`);
}

export function generateBulkInvoicePDF(invoices: InvoiceData[]): void {
  if (invoices.length === 0) return;
  const doc = new jsPDF();
  invoices.forEach((data, index) => {
    if (index > 0) doc.addPage();
    generateSingleInvoice(doc, data);
  });
  doc.save(`Invoices-Bulk-${invoices.length}.pdf`);
}

// Helper to convert order data to invoice format
export function orderToInvoiceData(order: {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
}): InvoiceData {
  let addressString = "N/A";
  if (order.shipping_address) {
    if (typeof order.shipping_address === "string") {
      addressString = order.shipping_address;
    } else if (typeof order.shipping_address === "object") {
      const parts = [
        order.shipping_address.street,
        order.shipping_address.area,
        order.shipping_address.city,
      ].filter(Boolean);
      addressString = parts.join(", ");
    }
  }

  return {
    order_number: order.order_number,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    shipping_address: addressString,
    items: order.items,
    subtotal: order.subtotal,
    shipping_cost: order.shipping_cost,
    discount: order.discount,
    total: order.total,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  };
}

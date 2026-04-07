import jsPDF from 'jspdf';

interface PackingSlipItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PackingSlipData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  items: PackingSlipItem[];
  notes?: string | null;
  store_name?: string;
}

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  bgLight: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export function generatePackingSlip(data: PackingSlipData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 5;

  // ========== TOP ACCENT BAR ==========
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  y = 20;

  // ========== HEADER ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.store_name || 'YOUR STORE', margin, y);

  // PACKING SLIP label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(200, 200, 210);
  doc.text('PACKING SLIP', pageWidth - margin, y, { align: 'right' });

  y += 12;

  // Order info bar
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 16, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Order:', margin + 5, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(data.order_number, margin + 22, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Date:', pageWidth - margin - 60, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }), pageWidth - margin - 43, y + 4);

  y += 22;

  // ========== SHIP TO ==========
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(margin, y - 4, 55, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('SHIP TO', margin + 5, y + 2);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(data.customer_name, margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  
  if (data.customer_phone) {
    doc.text(`📱 ${data.customer_phone}`, margin, y);
    y += 6;
  }
  if (data.shipping_address) {
    doc.text('📍 ', margin, y);
    const addressLines = doc.splitTextToSize(data.shipping_address, pageWidth - margin - 30);
    addressLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 6, y);
      if (i < addressLines.length - 1) y += 5;
    });
    y += 5;
  }

  y += 10;

  // ========== ITEMS TABLE ==========
  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('#', margin + 5, y + 2);
  doc.text('ITEM DESCRIPTION', margin + 16, y + 2);
  doc.text('QTY', pageWidth - margin - 40, y + 2, { align: 'right' });
  doc.text('CHECK', pageWidth - margin - 8, y + 2, { align: 'right' });

  y += 12;

  // Items
  data.items.forEach((item, index) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.bgLight);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 10, 'F');
    }

    // Index number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text(`${index + 1}`, margin + 5, y);

    // Product name
    const maxWidth = pageWidth - margin * 2 - 70;
    const productName = doc.splitTextToSize(item.product_name, maxWidth);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(productName[0], margin + 16, y);

    // Quantity
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`×${item.quantity}`, pageWidth - margin - 40, y, { align: 'right' });

    // Checkbox
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.8);
    doc.roundedRect(pageWidth - margin - 14, y - 4, 7, 7, 1, 1);

    y += productName.length > 1 ? 14 : 10;
  });

  y += 6;

  // ========== SUMMARY BAR ==========
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;
  const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
  
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(margin, y - 5, 80, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(`Total Items: ${totalQty}`, margin + 8, y + 3);

  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${data.items.length} product(s)`, margin + 90, y + 3);

  y += 18;

  // ========== NOTES ==========
  if (data.notes) {
    doc.setFillColor(255, 251, 235); // Amber 50
    doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 6 + doc.splitTextToSize(data.notes, pageWidth - margin * 2 - 16).length * 5, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 120, 50);
    doc.text('📋 ORDER NOTES', margin + 5, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 80, 30);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - margin * 2 - 16);
    noteLines.forEach((line: string) => {
      doc.text(line, margin + 5, y);
      y += 5;
    });
    y += 8;
  }

  // ========== SIGNATURE SECTION ==========
  y = Math.max(y + 15, pageHeight - 50);

  // Packed By
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 65, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Packed By', margin + 15, y + 8);
  doc.text('Date: ___________', margin + 5, y + 14);

  // Checked By
  doc.line(pageWidth - margin - 65, y, pageWidth - margin, y);
  doc.text('Checked By', pageWidth - margin - 50, y + 8);
  doc.text('Date: ___________', pageWidth - margin - 60, y + 14);

  // Bottom accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // Save
  doc.save(`packing-slip-${data.order_number}.pdf`);
}

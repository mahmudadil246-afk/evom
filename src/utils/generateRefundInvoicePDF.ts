import { jsPDF } from "jspdf";

interface RefundInvoiceData {
  order_number: string;
  refund_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  original_total: number;
  refund_amount: number;
  refund_reason: string;
  refund_status: string;
  payment_method: string;
  store_name?: string;
}

const COLORS = {
  primary: [212, 175, 55] as [number, number, number],
  dark: [26, 26, 26] as [number, number, number],
  text: [255, 255, 255] as [number, number, number],
  muted: [156, 163, 175] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  border: [55, 55, 55] as [number, number, number],
};

export function generateRefundInvoicePDF(data: RefundInvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const drawLine = (yPos: number, color = COLORS.border) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  // ========== HEADER ==========
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 55, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.store_name || "YOUR STORE", margin, y + 10);

  // Refund badge
  doc.setFillColor(...COLORS.danger);
  doc.roundedRect(pageWidth - margin - 50, y, 50, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("REFUND", pageWidth - margin - 25, y + 8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Credit Note #CN-${data.order_number}`, pageWidth - margin, y + 20, { align: "right" });

  const refundDate = new Date(data.refund_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(refundDate, pageWidth - margin, y + 27, { align: "right" });

  y = 65;

  // ========== CUSTOMER INFO ==========
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text("REFUND TO", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  y += 7;
  doc.text(data.customer_name, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (data.customer_phone) {
    doc.text(`Phone: ${data.customer_phone}`, margin, y);
    y += 5;
  }
  if (data.customer_email) {
    doc.text(`Email: ${data.customer_email}`, margin, y);
    y += 5;
  }

  // Original order info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text("ORIGINAL ORDER", pageWidth / 2, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order #${data.order_number}`, pageWidth / 2, 72);
  doc.text(`Original Total: ${formatCurrency(data.original_total)}`, pageWidth / 2, 77);
  doc.text(`Payment: ${data.payment_method || "N/A"}`, pageWidth / 2, 82);

  y = Math.max(y, 90) + 5;

  // ========== REFUND REASON ==========
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, "F");
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.danger);
  doc.text("REFUND REASON", margin + 5, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(data.refund_reason || "N/A", margin + 5, y);
  y += 12;

  // ========== ITEMS TABLE ==========
  drawLine(y);
  y += 8;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const col1 = margin + 2;
  const col2 = margin + 90;
  const col3 = margin + 115;
  const col4 = pageWidth - margin - 2;

  doc.text("ITEM", col1, y);
  doc.text("QTY", col2, y);
  doc.text("PRICE", col3, y);
  doc.text("TOTAL", col4, y, { align: "right" });

  y += 8;
  drawLine(y - 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  data.items.forEach((item) => {
    const productLines = doc.splitTextToSize(item.product_name, 80);
    doc.text(productLines[0], col1, y);
    doc.text(item.quantity.toString(), col2, y);
    doc.text(formatCurrency(item.unit_price), col3, y);
    doc.text(formatCurrency(item.total_price), col4, y, { align: "right" });
    if (productLines.length > 1) {
      for (let i = 1; i < productLines.length; i++) {
        y += 5;
        doc.text(productLines[i], col1, y);
      }
    }
    y += 8;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  y += 5;

  // ========== REFUND TOTAL ==========
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Original Total:", totalsX, y);
  doc.setTextColor(60, 60, 60);
  doc.text(formatCurrency(data.original_total), valuesX, y, { align: "right" });
  y += 10;

  doc.setDrawColor(...COLORS.danger);
  doc.setLineWidth(1);
  doc.line(totalsX - 10, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.danger);
  doc.text("REFUND:", totalsX, y);
  doc.text(`-${formatCurrency(data.refund_amount)}`, valuesX, y, { align: "right" });
  y += 10;

  // Refund status
  const statusColor = data.refund_status === "refunded" ? COLORS.success : COLORS.danger;
  doc.setFontSize(9);
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${data.refund_status.toUpperCase()}`, valuesX, y, { align: "right" });

  y += 20;

  // ========== FOOTER ==========
  drawLine(y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("This is a credit note for the refund processed against your order.", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(8);
  doc.text("If you have any questions, please contact our support team.", pageWidth / 2, y, { align: "center" });

  doc.save(`Refund-CN-${data.order_number}.pdf`);
}

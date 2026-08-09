import { jsPDF } from 'jspdf';

const WIDTH = 58; // mm — thermal paper 58mm
const MARGIN = 3;
const INNER = WIDTH - MARGIN * 2;

const money = (v: number) => `${Number(v || 0).toFixed(0)} FCFA`;

export interface ReceiptSettings {
  restaurant_name?: string | null;
  address?: string | null;
  phone?: string | null;
  phone2?: string | null;
  phone3?: string | null;
}

/**
 * Builds a 58mm-wide thermal receipt PDF for a sale.
 */
export function buildSaleReceiptPdf(sale: any, lines: any[], settings?: ReceiptSettings | null) {
  // Rough height estimate then create the document at that exact page size.
  const estimated = 60 + (lines?.length || 0) * 8 + 40;
  const doc = new jsPDF({ unit: 'mm', format: [WIDTH, estimated] });
  doc.setFont('helvetica', 'normal');

  let y = 6;
  const center = (text: string, size = 7, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, WIDTH / 2, y, { align: 'center' });
    y += size * 0.45 + 1.2;
  };
  const left = (text: string, size = 6.5, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const wrapped = doc.splitTextToSize(text, INNER) as string[];
    wrapped.forEach(w => {
      doc.text(w, MARGIN, y);
      y += size * 0.45 + 1;
    });
  };
  const row = (label: string, value: string, size = 6.5, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, MARGIN, y);
    doc.text(value, WIDTH - MARGIN, y, { align: 'right' });
    y += size * 0.45 + 1.2;
  };
  const sep = () => {
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y - 1, WIDTH - MARGIN, y - 1);
    y += 1.8;
  };

  if (settings?.restaurant_name) center(settings.restaurant_name, 8.5, true);
  if (settings?.address) left(settings.address, 6);
  const phones = [settings?.phone, settings?.phone2, settings?.phone3].filter(Boolean);
  if (phones.length) left(`Tel: ${phones.join(' / ')}`, 6);
  sep();

  left(`Facture: ${sale.invoice_number}`, 6.5, true);
  left(`Date: ${new Date(sale.date).toLocaleString('fr-FR')}`, 6);
  if (sale.client_id) left(`Client: ${sale.client_id}`, 6);
  if (sale.server_name) left(`Serveur/Serveuse: ${sale.server_name}`, 6);
  sep();

  (lines || []).forEach((line: any) => {
    left(line.product_name, 6.5);
    row(`${line.quantity} x ${money(line.price_ttc)}`, money(line.total_ttc), 6);
  });
  sep();

  row('Total HT', money(sale.total_ht), 6);
  row('TOTAL TTC', money(sale.total_ttc), 7.5, true);
  if (sale.credit_note_amount) {
    row('Avoir utilise', `-${money(sale.credit_note_amount)}`, 6);
    row('Reste a payer', money(Math.max(0, sale.total_ttc - sale.credit_note_amount)), 6);
  }
  row('Recu', money(sale.amount_received), 6);
  if (sale.new_credit_amount) row('Nouveau avoir', money(sale.new_credit_amount), 6);
  row('Rendu', money(sale.amount_returned), 6);
  if (sale.deferred || sale.status === 'deferred') {
    y += 1;
    center('PAIEMENT DIFFERE', 7, true);
  }
  y += 3;
  center('Merci de votre visite !', 6.5);

  return doc;
}

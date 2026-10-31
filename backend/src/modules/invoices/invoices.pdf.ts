import PDFDocument from "pdfkit";
import { Response } from "express";
import { getInvoice } from "./invoices.service";

type FullInvoice = Awaited<ReturnType<typeof getInvoice>>;

const money = (n: unknown) => `INR ${Number(n).toFixed(2)}`;
const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function draw(doc: PDFKit.PDFDocument, invoice: FullInvoice) {
  const left = 50;
  const right = doc.page.width - 50;

  doc.fillColor("#4f46e5").fontSize(20).text("Brightloop Software", left, 50);
  doc.fillColor("#6b7280").fontSize(9).text("Subscription billing", left, 74);
  doc.fillColor("#111827").fontSize(22).text("INVOICE", left, 50, { align: "right" });
  doc.fillColor("#6b7280").fontSize(10).text(invoice.number, left, 78, { align: "right" });

  doc.moveTo(left, 105).lineTo(right, 105).strokeColor("#e5e7eb").stroke();

  doc.fillColor("#6b7280").fontSize(8).text("BILLED TO", left, 120);
  doc.fillColor("#111827").fontSize(11).text(invoice.customer.name, left, 133);
  doc.fillColor("#374151").fontSize(10);
  if (invoice.customer.company) doc.text(invoice.customer.company);
  doc.text(invoice.customer.email);
  if (invoice.customer.address) doc.text(invoice.customer.address);

  doc.fillColor("#6b7280").fontSize(8).text("DETAILS", 340, 120);
  doc.fillColor("#374151").fontSize(10);
  doc.text(`Issued: ${date(invoice.issueDate)}`, 340, 133);
  doc.text(`Due: ${date(invoice.dueDate)}`, 340);
  doc.text(`Period: ${date(invoice.periodStart)} - ${date(invoice.periodEnd)}`, 340);
  doc.text(`Status: ${invoice.status}`, 340);

  let y = 215;
  doc.rect(left, y, right - left, 22).fill("#f3f4f6");
  doc.fillColor("#374151").fontSize(9);
  doc.text("DESCRIPTION", left + 8, y + 7);
  doc.text("QTY", 330, y + 7, { width: 30, align: "right" });
  doc.text("UNIT", 365, y + 7, { width: 60, align: "right" });
  doc.text("TAX", 430, y + 7, { width: 35, align: "right" });
  doc.text("AMOUNT", 470, y + 7, { width: right - 470 - 8, align: "right" });
  y += 30;

  doc.fillColor("#111827").fontSize(10);
  for (const line of invoice.lines) {
    doc.text(line.description, left + 8, y, { width: 270 });
    doc.text(String(line.quantity), 330, y, { width: 30, align: "right" });
    doc.text(Number(line.unitPrice).toFixed(2), 365, y, { width: 60, align: "right" });
    doc.text(`${Number(line.taxPercent)}%`, 430, y, { width: 35, align: "right" });
    doc.text(Number(line.amount).toFixed(2), 470, y, { width: right - 470 - 8, align: "right" });
    y += 22;
    doc.moveTo(left, y - 4).lineTo(right, y - 4).strokeColor("#f3f4f6").stroke();
  }

  y += 14;
  const row = (label: string, value: string, bold = false, color = "#374151") => {
    doc.fillColor(color).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10);
    doc.text(label, 340, y, { width: 110 });
    doc.text(value, 450, y, { width: right - 450, align: "right" });
    y += bold ? 22 : 18;
  };
  row("Subtotal", money(invoice.subtotal));
  for (const d of invoice.discounts) row(`Discount: ${d.discount.name}`, `-${money(d.amount)}`, false, "#047857");
  row("Tax", money(invoice.taxTotal));
  doc.moveTo(340, y - 2).lineTo(right, y - 2).strokeColor("#d1d5db").stroke();
  y += 6;
  row("Total", money(invoice.total), true, "#111827");
  row("Paid", money(invoice.amountPaid));
  row("Balance due", money(Number(invoice.total) - Number(invoice.amountPaid)), true, "#4f46e5");

  doc.font("Helvetica").fillColor("#9ca3af").fontSize(8).text("Thank you for your business.", left, doc.page.height - 70, {
    align: "center",
    width: right - left,
  });
}

export async function buildInvoicePdf(id: number): Promise<{ filename: string; buffer: Buffer }> {
  const invoice = await getInvoice(id);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  draw(doc, invoice);
  doc.end();
  return { filename: `${invoice.number}.pdf`, buffer: await done };
}

export async function streamInvoicePdf(id: number, res: Response) {
  const { filename, buffer } = await buildInvoicePdf(id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Content-Length", String(buffer.length));
  res.end(buffer);
}

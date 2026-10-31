import PDFDocument from "pdfkit";
import { Response } from "express";
import { getInvoice } from "./invoices.service";

export async function streamInvoicePdf(id: number, res: Response) {
  const invoice = await getInvoice(id);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.number}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("Invoice", { align: "right" });
  doc.fontSize(10).text(invoice.number, { align: "right" });
  doc.moveDown();

  doc.fontSize(12).text("Bill to:");
  doc.fontSize(10).text(invoice.customer.name);
  if (invoice.customer.company) doc.text(invoice.customer.company);
  doc.text(invoice.customer.email);
  if (invoice.customer.address) doc.text(invoice.customer.address);
  doc.moveDown();

  doc.text(`Issue date: ${invoice.issueDate.toDateString()}`);
  doc.text(`Due date: ${invoice.dueDate.toDateString()}`);
  doc.text(`Period: ${invoice.periodStart.toDateString()} - ${invoice.periodEnd.toDateString()}`);
  doc.text(`Status: ${invoice.status}`);
  doc.moveDown();

  doc.fontSize(12).text("Lines");
  doc.fontSize(10);
  for (const line of invoice.lines) {
    doc.text(
      `${line.description}  x${line.quantity}  @ ${Number(line.unitPrice).toFixed(2)}  tax ${Number(
        line.taxPercent
      ).toFixed(2)}%  = ${Number(line.amount).toFixed(2)}`
    );
  }
  doc.moveDown();

  if (invoice.discounts.length > 0) {
    doc.fontSize(12).text("Discounts");
    doc.fontSize(10);
    for (const d of invoice.discounts) {
      doc.text(`${d.discount.name}: -${Number(d.amount).toFixed(2)}`);
    }
    doc.moveDown();
  }

  doc.fontSize(12).text(`Subtotal: ${Number(invoice.subtotal).toFixed(2)}`);
  doc.text(`Discount total: -${Number(invoice.discountTotal).toFixed(2)}`);
  doc.text(`Tax total: ${Number(invoice.taxTotal).toFixed(2)}`);
  doc.fontSize(14).text(`Total: ${Number(invoice.total).toFixed(2)}`);
  doc.fontSize(10).text(`Amount paid: ${Number(invoice.amountPaid).toFixed(2)}`);

  doc.end();
}

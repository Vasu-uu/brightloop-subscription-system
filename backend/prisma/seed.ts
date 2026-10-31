import { PrismaClient, BillingPeriod, DiscountAppliesTo, DiscountType, InvoiceStatus, PaymentMethod, ProductType, Role, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BATCH = 500;
let state = 0x5eed1234;
function rand(): number {
  state = (1664525 * state + 1013904223) >>> 0;
  return state / 0x100000000;
}
function int(max: number): number { return Math.floor(rand() * max); }
function money(value: number): string { return value.toFixed(2); }
async function batched<T>(rows: T[], insert: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += BATCH) await insert(rows.slice(i, i + BATCH));
}
const now = new Date();
const day = 86_400_000;
const periods: BillingPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const statuses: SubscriptionStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "CONFIRMED", "QUOTATION", "DRAFT", "CLOSED"];
const invoiceStatuses: InvoiceStatus[] = ["DRAFT", "CONFIRMED", "CONFIRMED", "CONFIRMED", "PAID", "CANCELLED"];

async function clearDatabase() {
  await prisma.payment.deleteMany();
  await prisma.invoiceDiscount.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationTemplateLine.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();
  const passwordHash = await bcrypt.hash("Brightloop@123", 10);
  const users = await prisma.user.createMany({ data: [
    { email: "admin@brightloop.test", passwordHash, name: "Brightloop Admin", role: Role.ADMIN },
    { email: "staff@brightloop.test", passwordHash, name: "Brightloop Staff", role: Role.STAFF },
    { email: "customer@brightloop.test", passwordHash, name: "Demo Customer", role: Role.CUSTOMER },
    ...Array.from({ length: 800 }, (_, i) => ({
      email: `customer${String(i + 1).padStart(4, "0")}@brightloop.test`,
      passwordHash, name: `Demo Customer ${i + 1}`, role: Role.CUSTOMER,
      company: `Company ${i + 1}`, phone: `90000${String(i).padStart(5, "0")}`,
    })),
  ]});
  void users;
  const customers = await prisma.user.findMany({ where: { email: { startsWith: "customer" } }, select: { id: true }, orderBy: { id: "asc" } });
  const taxesData = [
    ["GST 5%", "5.00"], ["GST 12%", "12.00"], ["GST 18%", "18.00"], ["GST 28%", "28.00"], ["Zero Rated", "0.00"],
  ] as const;
  await prisma.tax.createMany({ data: taxesData.map(([name, ratePercent]) => ({ name, ratePercent })) });
  const taxes = await prisma.tax.findMany({ orderBy: { id: "asc" } });
  const productNames = ["Cloud Workspace", "Analytics Suite", "CRM Pro", "Inventory Manager", "Payroll Cloud", "Support Desk", "API Access", "Security Monitor", "Marketing Hub", "Project Tracker", "Storage Plus", "Automation Suite"];
  await prisma.product.createMany({ data: productNames.map((name, i) => ({
    name, type: i % 3 === 0 ? ProductType.GOODS : ProductType.SERVICE,
    salesPrice: money(499 + i * 175), costPrice: money(120 + i * 42),
    notes: `Seeded Brightloop product ${i + 1}`, taxId: taxes[i % taxes.length].id,
  })) });
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  await prisma.productVariant.createMany({ data: products.flatMap((p, i) => [
    { productId: p.id, attribute: "Brand", value: "Standard", extraPrice: money(0) },
    { productId: p.id, attribute: "Brand", value: "Odoo", extraPrice: money(560) },
  ]) });
  const plansData = [
    ["Daily Starter", "199.00", BillingPeriod.DAILY],
    ["Weekly Growth", "899.00", BillingPeriod.WEEKLY],
    ["Monthly Basic", "2499.00", BillingPeriod.MONTHLY],
    ["Monthly Pro", "4999.00", BillingPeriod.MONTHLY],
    ["Annual Business", "39999.00", BillingPeriod.YEARLY],
    ["Annual Enterprise", "79999.00", BillingPeriod.YEARLY],
  ] as const;
  await prisma.plan.createMany({ data: plansData.map(([name, price, billingPeriod], i) => ({
    name, price, billingPeriod, minQuantity: i % 2 ? 2 : 1,
    availableFrom: new Date(now.getTime() - 365 * day), availableTo: null,
    autoClose: i % 2 === 0, allowEarlyClose: true, allowPause: true, allowRenew: true,
  })) });
  const plans = await prisma.plan.findMany({ orderBy: { id: "asc" } });
  await prisma.discount.createMany({ data: [
    { name: "Launch 10%", type: DiscountType.PERCENTAGE, value: money(10), appliesTo: DiscountAppliesTo.SUBSCRIPTION, startDate: new Date(now.getTime() - 30 * day), endDate: new Date(now.getTime() + 180 * day), usageLimit: 1000 },
    { name: "Seat Saver", type: DiscountType.FIXED, value: money(500), appliesTo: DiscountAppliesTo.PRODUCT, minQuantity: 2, startDate: new Date(now.getTime() - 30 * day), usageLimit: 500 },
    { name: "Enterprise 15%", type: DiscountType.PERCENTAGE, value: money(15), appliesTo: DiscountAppliesTo.SUBSCRIPTION, minPurchase: money(10000), startDate: new Date(now.getTime() - 30 * day), usageLimit: 250 },
  ] });
  await prisma.quotationTemplate.createMany({ data: plans.slice(0, 3).map((p, i) => ({
    name: ["Starter Quote", "Growth Quote", "Business Quote"][i], planId: p.id, validityDays: 14 + i * 7,
  })) });
  const templates = await prisma.quotationTemplate.findMany({ orderBy: { id: "asc" } });
  await prisma.quotationTemplateLine.createMany({ data: templates.map((t, i) => ({
    templateId: t.id, productId: products[i].id, quantity: 1 + i,
  })) });

  const subscriptionRows = Array.from({ length: 5000 }, (_, i) => {
    const customer = customers[int(customers.length)];
    const plan = plans[int(plans.length)];
    const startDate = new Date(now.getTime() - (30 + int(700)) * day);
    const status = statuses[int(statuses.length)];
    return {
      number: `SUB-${String(i + 1).padStart(5, "0")}`, customerId: customer.id, planId: plan.id,
      templateId: i % 7 === 0 ? templates[i % templates.length].id : null,
      status, isPaused: status === "ACTIVE" && i % 29 === 0,
      startDate, expiryDate: new Date(startDate.getTime() + 365 * day),
      paymentTermDays: [0, 7, 15, 30][int(4)],
      quotationValidUntil: status === "QUOTATION" ? new Date(now.getTime() + 14 * day) : null,
      nextBillingDate: status === "ACTIVE" ? new Date(now.getTime() - int(20) * day) : null,
    };
  });
  await batched(subscriptionRows, async batch => { await prisma.subscription.createMany({ data: batch }); });
  const subscriptions = await prisma.subscription.findMany({ select: { id: true, customerId: true, planId: true }, orderBy: { id: "asc" } });
  const variants = await prisma.productVariant.findMany({ orderBy: { id: "asc" } });
  const subLines = subscriptions.map((s, i) => {
    const product = products[i % products.length];
    const variant = variants.find(v => v.productId === product.id && v.value === (i % 2 ? "Odoo" : "Standard"))!;
    const quantity = 1 + (i % 4);
    const unitPrice = Number(product.salesPrice) + Number(variant.extraPrice);
    return { subscriptionId: s.id, productId: product.id, variantId: variant.id, quantity, unitPrice: money(unitPrice), taxId: product.taxId, taxPercent: taxes[i % taxes.length].ratePercent, amount: money(quantity * unitPrice) };
  });
  await batched(subLines, async batch => { await prisma.subscriptionLine.createMany({ data: batch }); });

  const invoiceRows = subscriptions.map((s, i) => {
    const line = subLines[i];
    const subtotal = Number(line.amount);
    const taxTotal = Math.round(subtotal * Number(line.taxPercent) / 100 * 100) / 100;
    const discountTotal = i % 11 === 0 ? Math.min(100, subtotal) : 0;
    const total = subtotal - discountTotal + taxTotal;
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const issueDate = new Date(now.getTime() - (i % 75) * day);
    const dueDate = new Date(issueDate.getTime() + [0, 7, 15, 30][i % 4] * day);
    let amountPaid = 0;
    if (status === "PAID") amountPaid = total;
    if (status === "CONFIRMED" && i % 6 === 3) amountPaid = Math.min(total - 1, Math.round(total * 0.4 * 100) / 100);
    return {
      number: `INV-${String(i + 1).padStart(5, "0")}`, subscriptionId: s.id, customerId: s.customerId,
      status, issueDate, dueDate, periodStart: new Date(issueDate.getTime() - 30 * day),
      periodEnd: issueDate, subtotal: money(subtotal), discountTotal: money(discountTotal),
      taxTotal: money(taxTotal), total: money(total), amountPaid: money(amountPaid),
    };
  });
  await batched(invoiceRows, async batch => { await prisma.invoice.createMany({ data: batch }); });
  const invoices = await prisma.invoice.findMany({ select: { id: true, total: true, amountPaid: true, taxTotal: true, status: true }, orderBy: { id: "asc" } });
  await batched(invoices.map((inv, i) => ({
    invoiceId: inv.id,
    description: `Subscription service ${i + 1}`,
    productId: products[i % products.length].id,
    quantity: subLines[i].quantity,
    unitPrice: subLines[i].unitPrice,
    taxPercent: subLines[i].taxPercent,
    taxAmount: money(Number(inv.taxTotal)),
    amount: subLines[i].amount,
  })), async batch => { await prisma.invoiceLine.createMany({ data: batch }); });
  const payments = invoices.flatMap((inv, i) => {
    const paid = Number(inv.amountPaid);
    if (paid <= 0) return [];
    return [{ invoiceId: inv.id, method: (["UPI", "CARD", "BANK_TRANSFER", "CASH", "CHEQUE"] as PaymentMethod[])[i % 5], amount: money(paid), paymentDate: new Date(now.getTime() - (i % 45) * day), note: "Seeded payment" }];
  });
  await batched(payments, async batch => { await prisma.payment.createMany({ data: batch }); });
  console.log(`Seed complete: 803 users, 5 taxes, 12 products, 6 plans, 5,000 subscriptions, ${invoices.length} invoices, ${payments.length} payments.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

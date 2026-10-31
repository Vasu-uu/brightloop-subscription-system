export type Role = "ADMIN" | "STAFF" | "CUSTOMER";
export type ProductType = "SERVICE" | "GOODS";
export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type SubscriptionStatus = "DRAFT" | "QUOTATION" | "CONFIRMED" | "ACTIVE" | "CLOSED";
export type InvoiceStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
export type DiscountType = "FIXED" | "PERCENTAGE";
export type DiscountAppliesTo = "PRODUCT" | "SUBSCRIPTION";

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Tax {
  id: number;
  name: string;
  ratePercent: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  attribute: string;
  value: string;
  extraPrice: number;
}

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  salesPrice: number;
  costPrice: number;
  notes?: string | null;
  taxId?: number | null;
  isActive: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  minQuantity: number;
  availableFrom: string;
  availableTo?: string | null;
  autoClose: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenew: boolean;
  isActive: boolean;
}

export interface Discount {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  appliesTo: DiscountAppliesTo;
  minPurchase?: number | null;
  minQuantity?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface QuotationTemplateLine {
  id: number;
  templateId: number;
  productId: number;
  product?: Product;
  variantId?: number | null;
  variant?: ProductVariant | null;
  quantity: number;
}

export interface QuotationTemplate {
  id: number;
  name: string;
  planId: number;
  plan?: Plan;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
  lines?: QuotationTemplateLine[];
}

export interface SubscriptionLine {
  id: number;
  subscriptionId: number;
  productId: number;
  product?: Product;
  variantId?: number | null;
  variant?: ProductVariant | null;
  quantity: number;
  unitPrice: number;
  taxId?: number | null;
  tax?: Tax | null;
  taxPercent: number;
  amount: number;
}

export interface Subscription {
  id: number;
  number: string;
  customerId: number;
  customer?: User;
  planId: number;
  plan?: Plan;
  templateId?: number | null;
  template?: QuotationTemplate | null;
  status: SubscriptionStatus;
  isPaused: boolean;
  startDate: string;
  expiryDate: string;
  paymentTermDays: number;
  quotationValidUntil?: string | null;
  nextBillingDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: SubscriptionLine[];
  invoices?: Invoice[];
}

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  productId?: number | null;
  product?: Product | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
}

export interface InvoiceDiscount {
  id: number;
  invoiceId: number;
  discountId: number;
  discount?: Discount;
  amount: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  note?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: number;
  number: string;
  subscriptionId: number;
  subscription?: Subscription;
  customerId: number;
  customer?: User;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  sentAt?: string | null;
  createdAt: string;
  lines?: InvoiceLine[];
  discounts?: InvoiceDiscount[];
  payments?: Payment[];
}

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export const ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;
export const PRODUCT_TYPES = ["SERVICE", "GOODS"] as const;
export const BILLING_PERIODS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export const SUBSCRIPTION_STATUSES = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;
export const INVOICE_STATUSES = ["DRAFT", "CONFIRMED", "PAID", "CANCELLED"] as const;
export const PAYMENT_METHODS = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"] as const;
export const DISCOUNT_TYPES = ["FIXED", "PERCENTAGE"] as const;
export const DISCOUNT_APPLIES_TO = ["PRODUCT", "SUBSCRIPTION"] as const;

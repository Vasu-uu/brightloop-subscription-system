import express from "express";
import cors from "cors";
import { errorHandler } from "./shared/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { staffRouter } from "./modules/staff/staff.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { productsRouter } from "./modules/products/products.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { taxesRouter } from "./modules/taxes/taxes.routes";
import { discountsRouter } from "./modules/discounts/discounts.routes";
import { quotationTemplatesRouter } from "./modules/quotation-templates/quotation-templates.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { billingRouter } from "./modules/billing/billing.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import portalRouter from "./modules/portal/portal.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/plans", plansRouter);
app.use("/api/v1/taxes", taxesRouter);
app.use("/api/v1/discounts", discountsRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/portal", portalRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/quotation-templates", quotationTemplatesRouter);
app.use("/api/v1/subscriptions", subscriptionsRouter);
app.use("/api/v1/invoices", invoicesRouter);
app.use("/api/v1/billing", billingRouter);

app.use(errorHandler);

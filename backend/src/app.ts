import express from "express";
import cors from "cors";
import { errorHandler } from "./shared/errorHandler";
import { quotationTemplatesRouter } from "./modules/quotation-templates/quotation-templates.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { billingRouter } from "./modules/billing/billing.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/quotation-templates", quotationTemplatesRouter);
app.use("/api/v1/subscriptions", subscriptionsRouter);
app.use("/api/v1/invoices", invoicesRouter);
app.use("/api/v1/billing", billingRouter);

app.use(errorHandler);

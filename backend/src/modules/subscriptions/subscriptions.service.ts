import { Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/AppError";
import { ParsedPagination } from "../../shared/pagination";
import { calculateLineTotals, LineInput } from "../../services/pricing.service.stub";
import { z } from "zod";
import { createSubscriptionSchema, fromTemplateSchema, updateSubscriptionSchema } from "./subscriptions.validation";

type CreateInput = z.infer<typeof createSubscriptionSchema>;
type UpdateInput = z.infer<typeof updateSubscriptionSchema>;
type FromTemplateInput = z.infer<typeof fromTemplateSchema>;

export const detailInclude = {
  customer: true,
  plan: true,
  template: true,
  lines: { include: { product: true, variant: true, tax: true } },
} as const;

async function nextSubscriptionNumber(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ maxNum: number | bigint | null }[]>(
    Prisma.sql`SELECT MAX(CAST(SUBSTRING(number, 5) AS UNSIGNED)) as maxNum FROM Subscription FOR UPDATE`
  );
  const next = Number(rows[0]?.maxNum ?? 0) + 1;
  return `SUB-${String(next).padStart(5, "0")}`;
}

async function assertPlanWindow(planId: number, startDate: Date) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new AppError(400, "VALIDATION_ERROR", "Plan not found", { planId: "Plan does not exist" });
  }
  if (startDate < plan.availableFrom || (plan.availableTo && startDate > plan.availableTo)) {
    throw new AppError(400, "VALIDATION_ERROR", "Start date is outside the plan's availability window", {
      startDate: "Outside plan availability",
    });
  }
  return plan;
}

async function buildLines(lines: { productId: number; variantId?: number | null; quantity: number }[], plan: { minQuantity: number }) {
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const variantIds = [...new Set(lines.map((l) => l.variantId).filter((id): id is number => id != null))];

  const [products, variants] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    variantIds.length ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } }) : Promise.resolve([]),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const lineInputs: LineInput[] = lines.map((line, idx) => {
    const product = productById.get(line.productId);
    if (!product) {
      throw new AppError(400, "VALIDATION_ERROR", "Product not found", { [`lines.${idx}.productId`]: "Product does not exist" });
    }
    if (line.quantity < plan.minQuantity) {
      throw new AppError(400, "VALIDATION_ERROR", `Quantity must be at least ${plan.minQuantity} for this plan`, {
        [`lines.${idx}.quantity`]: `Minimum quantity is ${plan.minQuantity}`,
      });
    }
    const variant = line.variantId != null ? variantById.get(line.variantId) : undefined;
    if (line.variantId != null && !variant) {
      throw new AppError(400, "VALIDATION_ERROR", "Variant not found", { [`lines.${idx}.variantId`]: "Variant does not exist" });
    }
    const unitPrice = Number(product.salesPrice) + (variant ? Number(variant.extraPrice) : 0);
    return {
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: line.quantity,
      unitPrice,
      taxId: product.taxId,
    };
  });

  const { lines: priced } = await calculateLineTotals(lineInputs);
  return priced;
}

export async function listSubscriptions(
  pagination: ParsedPagination,
  filters: { status?: string; customerId?: number; search?: string; from?: Date; to?: Date }
) {
  const where: Prisma.SubscriptionWhereInput = {};
  if (filters.status) where.status = filters.status as SubscriptionStatus;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) where.number = { contains: filters.search };
  if (filters.from || filters.to) {
    where.startDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: { customer: true, plan: true },
      orderBy: { [pagination.sort]: pagination.order },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.subscription.count({ where }),
  ]);

  return { rows, total };
}

export async function getSubscription(id: number) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: detailInclude });
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }
  return subscription;
}

export async function createSubscription(input: CreateInput) {
  const plan = await assertPlanWindow(input.planId, input.startDate);
  const customer = await prisma.user.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw new AppError(400, "VALIDATION_ERROR", "Customer not found", { customerId: "Customer does not exist" });
  }
  const lines = await buildLines(input.lines, plan);

  return prisma.$transaction(async (tx) => {
    const number = await nextSubscriptionNumber(tx);
    return tx.subscription.create({
      data: {
        number,
        customerId: input.customerId,
        planId: input.planId,
        status: "DRAFT",
        startDate: input.startDate,
        expiryDate: input.expiryDate,
        paymentTermDays: input.paymentTermDays,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxId: line.taxId ?? null,
            taxPercent: line.taxPercent,
            amount: line.amount,
          })),
        },
      },
      include: detailInclude,
    });
  });
}

export async function updateSubscription(id: number, input: UpdateInput) {
  await getSubscription(id);
  const plan = await assertPlanWindow(input.planId, input.startDate);
  const customer = await prisma.user.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw new AppError(400, "VALIDATION_ERROR", "Customer not found", { customerId: "Customer does not exist" });
  }
  const lines = await buildLines(input.lines, plan);

  return prisma.$transaction(async (tx) => {
    await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });
    return tx.subscription.update({
      where: { id },
      data: {
        customerId: input.customerId,
        planId: input.planId,
        startDate: input.startDate,
        expiryDate: input.expiryDate,
        paymentTermDays: input.paymentTermDays,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxId: line.taxId ?? null,
            taxPercent: line.taxPercent,
            amount: line.amount,
          })),
        },
      },
      include: detailInclude,
    });
  });
}

export async function createSubscriptionFromTemplate(input: FromTemplateInput) {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id: input.templateId },
    include: { lines: true, plan: true },
  });
  if (!template) {
    throw new AppError(400, "VALIDATION_ERROR", "Template not found", { templateId: "Template does not exist" });
  }
  const plan = await assertPlanWindow(template.planId, input.startDate);
  const customer = await prisma.user.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw new AppError(400, "VALIDATION_ERROR", "Customer not found", { customerId: "Customer does not exist" });
  }

  const lines = await buildLines(
    template.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    plan
  );

  const quotationValidUntil = addDays(input.startDate, template.validityDays);
  // Contract 1.6/1.7 define quotationValidUntil for from-template but not how
  // expiryDate (a required field) is derived here. Flagged to the team;
  // defaulting to plan.availableTo when set, else startDate + 1 year so the
  // record is valid and can be adjusted via PUT before confirming.
  const expiryDate = plan.availableTo ?? addDays(input.startDate, 365);

  return prisma.$transaction(async (tx) => {
    const number = await nextSubscriptionNumber(tx);
    return tx.subscription.create({
      data: {
        number,
        customerId: input.customerId,
        planId: template.planId,
        templateId: template.id,
        status: "DRAFT",
        startDate: input.startDate,
        expiryDate,
        quotationValidUntil,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxId: line.taxId ?? null,
            taxPercent: line.taxPercent,
            amount: line.amount,
          })),
        },
      },
      include: detailInclude,
    });
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addBillingPeriod(date: Date, billingPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"): Date {
  const result = new Date(date);
  switch (billingPeriod) {
    case "DAILY":
      result.setDate(result.getDate() + 1);
      break;
    case "WEEKLY":
      result.setDate(result.getDate() + 7);
      break;
    case "MONTHLY":
      result.setMonth(result.getMonth() + 1);
      break;
    case "YEARLY":
      result.setFullYear(result.getFullYear() + 1);
      break;
  }
  return result;
}

const STATUS_ORDER: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"];

export async function transitionSubscription(id: number, to: SubscriptionStatus) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }

  const currentIndex = STATUS_ORDER.indexOf(subscription.status);
  const targetIndex = STATUS_ORDER.indexOf(to);
  const isOneStepForward = targetIndex === currentIndex + 1;
  const isEarlyClose = to === "CLOSED" && subscription.status !== "ACTIVE" && subscription.status !== "CLOSED";

  if (isEarlyClose) {
    if (!subscription.plan.allowEarlyClose) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        `Cannot close early: plan "${subscription.plan.name}" does not allow early close`
      );
    }
  } else if (!isOneStepForward) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `Illegal status transition from ${subscription.status} to ${to}; only one step forward is allowed`
    );
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      status: to,
      nextBillingDate: to === "ACTIVE" ? subscription.startDate : subscription.nextBillingDate,
    },
    include: detailInclude,
  });
}

export async function pauseSubscription(id: number) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }
  if (!subscription.plan.allowPause) {
    throw new AppError(400, "VALIDATION_ERROR", `Plan "${subscription.plan.name}" does not allow pausing`);
  }
  if (subscription.status !== "ACTIVE") {
    throw new AppError(400, "VALIDATION_ERROR", "Only an ACTIVE subscription can be paused");
  }
  if (subscription.isPaused) {
    throw new AppError(400, "VALIDATION_ERROR", "Subscription is already paused");
  }
  return prisma.subscription.update({ where: { id }, data: { isPaused: true }, include: detailInclude });
}

export async function resumeSubscription(id: number) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }
  if (!subscription.isPaused) {
    throw new AppError(400, "VALIDATION_ERROR", "Subscription is not paused");
  }
  return prisma.subscription.update({ where: { id }, data: { isPaused: false }, include: detailInclude });
}

export async function renewSubscription(id: number) {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!subscription) {
    throw new AppError(404, "NOT_FOUND", "Subscription not found");
  }
  if (!subscription.plan.allowRenew) {
    throw new AppError(400, "VALIDATION_ERROR", `Plan "${subscription.plan.name}" does not allow renewal`);
  }
  if (subscription.status !== "ACTIVE") {
    throw new AppError(400, "VALIDATION_ERROR", "Only an ACTIVE subscription can be renewed");
  }
  return prisma.subscription.update({
    where: { id },
    data: { expiryDate: addBillingPeriod(subscription.expiryDate, subscription.plan.billingPeriod) },
    include: detailInclude,
  });
}

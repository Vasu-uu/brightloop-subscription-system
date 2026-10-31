import { prisma } from "../../shared/prisma";
import { ParsedPagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { z } from "zod";
import { createTemplateSchema, updateTemplateSchema } from "./quotation-templates.validation";

type CreateInput = z.infer<typeof createTemplateSchema>;
type UpdateInput = z.infer<typeof updateTemplateSchema>;

const detailInclude = {
  plan: true,
  lines: { include: { product: true, variant: true } },
} as const;

export async function listTemplates(pagination: ParsedPagination, search?: string) {
  const where = search
    ? { name: { contains: search } }
    : {};

  const [rows, total] = await Promise.all([
    prisma.quotationTemplate.findMany({
      where,
      include: { plan: true, _count: { select: { lines: true } } },
      orderBy: { [pagination.sort]: pagination.order },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.quotationTemplate.count({ where }),
  ]);

  return { rows, total };
}

export async function getTemplate(id: number) {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!template) {
    throw new AppError(404, "NOT_FOUND", "Quotation template not found");
  }
  return template;
}

export async function createTemplate(input: CreateInput) {
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError(400, "VALIDATION_ERROR", "Plan not found", { planId: "Plan does not exist" });
  }

  return prisma.quotationTemplate.create({
    data: {
      name: input.name,
      planId: input.planId,
      validityDays: input.validityDays,
      lines: {
        create: input.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId ?? null,
          quantity: line.quantity,
        })),
      },
    },
    include: detailInclude,
  });
}

export async function updateTemplate(id: number, input: UpdateInput) {
  await getTemplate(id);

  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError(400, "VALIDATION_ERROR", "Plan not found", { planId: "Plan does not exist" });
  }

  return prisma.$transaction(async (tx) => {
    await tx.quotationTemplateLine.deleteMany({ where: { templateId: id } });
    return tx.quotationTemplate.update({
      where: { id },
      data: {
        name: input.name,
        planId: input.planId,
        validityDays: input.validityDays,
        isActive: input.isActive,
        lines: {
          create: input.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
          })),
        },
      },
      include: detailInclude,
    });
  });
}

export async function deleteTemplate(id: number) {
  await getTemplate(id);
  const inUse = await prisma.subscription.findFirst({ where: { templateId: id } });
  if (inUse) {
    throw new AppError(409, "CONFLICT", "Template is in use by existing subscriptions");
  }
  await prisma.quotationTemplate.delete({ where: { id } });
}

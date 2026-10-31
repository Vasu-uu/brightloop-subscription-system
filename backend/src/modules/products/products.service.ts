import { z } from "zod";
import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/AppError";
import { ParsedPagination } from "../../shared/pagination";
import { productSchema, updateProductSchema, variantSchema } from "./products.validation";

type CreateInput = z.infer<typeof productSchema>;
type UpdateInput = z.infer<typeof updateProductSchema>;
type VariantInput = z.infer<typeof variantSchema>;

const detailInclude = { variants: true, tax: true } as const;

export async function listProducts(pagination: ParsedPagination, search?: string) {
  const where = search ? { name: { contains: search } } : {};
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: detailInclude,
      orderBy: { [pagination.sort]: pagination.order },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.product.count({ where }),
  ]);
  return { rows, total };
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id }, include: detailInclude });
  if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
  return product;
}

export async function createProduct(input: CreateInput) {
  return prisma.product.create({
    data: {
      name: input.name,
      type: input.type,
      salesPrice: input.salesPrice,
      costPrice: input.costPrice,
      notes: input.notes,
      taxId: input.taxId ?? null,
      variants: input.variants ? { create: input.variants } : undefined,
    },
    include: detailInclude,
  });
}

export async function updateProduct(id: number, input: UpdateInput) {
  await getProduct(id);
  return prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      salesPrice: input.salesPrice,
      costPrice: input.costPrice,
      notes: input.notes,
      taxId: input.taxId,
      isActive: input.isActive,
    },
    include: detailInclude,
  });
}

export async function deleteProduct(id: number) {
  await getProduct(id);
  const inUse = await prisma.subscriptionLine.findFirst({ where: { productId: id } });
  if (inUse) {
    throw new AppError(409, "CONFLICT", "Product is in use by existing subscriptions");
  }
  await prisma.product.delete({ where: { id } });
}

export async function addVariant(productId: number, input: VariantInput) {
  await getProduct(productId);
  return prisma.productVariant.create({ data: { productId, ...input } });
}

export async function updateVariant(productId: number, variantId: number, input: Partial<VariantInput>) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");
  return prisma.productVariant.update({ where: { id: variantId }, data: input });
}

export async function deleteVariant(productId: number, variantId: number) {
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");
  await prisma.productVariant.delete({ where: { id: variantId } });
}

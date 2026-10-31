import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { productSchema, updateProductSchema, variantSchema } from "./products.validation";
import * as service from "./products.service";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  return id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { rows, total } = await service.listProducts(pagination, search);
  sendData(res, rows, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  sendData(res, await service.getProduct(parseId(req.params.id)));
}

export async function create(req: Request, res: Response): Promise<void> {
  sendData(res, await service.createProduct(productSchema.parse(req.body)));
}

export async function update(req: Request, res: Response): Promise<void> {
  sendData(res, await service.updateProduct(parseId(req.params.id), updateProductSchema.parse(req.body)));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteProduct(parseId(req.params.id));
  sendData(res, { id: parseId(req.params.id) });
}

export async function addVariant(req: Request, res: Response): Promise<void> {
  sendData(res, await service.addVariant(parseId(req.params.id), variantSchema.parse(req.body)));
}

export async function updateVariant(req: Request, res: Response): Promise<void> {
  sendData(
    res,
    await service.updateVariant(parseId(req.params.id), parseId(req.params.vid), variantSchema.partial().parse(req.body))
  );
}

export async function removeVariant(req: Request, res: Response): Promise<void> {
  await service.deleteVariant(parseId(req.params.id), parseId(req.params.vid));
  sendData(res, { id: parseId(req.params.vid) });
}

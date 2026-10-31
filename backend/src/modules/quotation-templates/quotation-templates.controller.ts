import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { createTemplateSchema, updateTemplateSchema } from "./quotation-templates.validation";
import * as service from "./quotation-templates.service";

export async function list(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { rows, total } = await service.listTemplates(pagination, search);
  sendData(res, rows, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createTemplateSchema.parse(req.body);
  const template = await service.createTemplate(input);
  sendData(res, template);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const template = await service.getTemplate(id);
  sendData(res, template);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const input = updateTemplateSchema.parse(req.body);
  const template = await service.updateTemplate(id, input);
  sendData(res, template);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await service.deleteTemplate(id);
  sendData(res, { id });
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  }
  return id;
}

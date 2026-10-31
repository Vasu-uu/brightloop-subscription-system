import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import { listInvoicesQuerySchema } from "./invoices.validation";
import { streamInvoicePdf } from "./invoices.pdf";
import * as service from "./invoices.service";

export async function list(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const query = listInvoicesQuerySchema.parse(req.query);
  const { rows, total } = await service.listInvoices(pagination, query);
  sendData(res, rows, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const invoice = await service.getInvoice(parseId(req.params.id));
  sendData(res, invoice);
}

export async function confirm(req: Request, res: Response): Promise<void> {
  const invoice = await service.confirmInvoice(parseId(req.params.id));
  sendData(res, invoice);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const invoice = await service.cancelInvoice(parseId(req.params.id));
  sendData(res, invoice);
}

export async function send(req: Request, res: Response): Promise<void> {
  const invoice = await service.sendInvoice(parseId(req.params.id));
  sendData(res, invoice);
}

export async function pdf(req: Request, res: Response): Promise<void> {
  await streamInvoicePdf(parseId(req.params.id), res);
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  }
  return id;
}

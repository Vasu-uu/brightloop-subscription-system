import { Request, Response } from "express";
import { sendData } from "../../shared/response";
import { parsePagination } from "../../shared/pagination";
import { AppError } from "../../shared/AppError";
import {
  createSubscriptionSchema,
  fromTemplateSchema,
  transitionSchema,
  updateSubscriptionSchema,
} from "./subscriptions.validation";
import * as service from "./subscriptions.service";

export async function list(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.listSubscriptions(pagination, {
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
    expiringInDays: req.query.expiringInDays ? Number(req.query.expiringInDays) : undefined,
  });
  sendData(res, rows, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createSubscriptionSchema.parse(req.body);
  const subscription = await service.createSubscription(input);
  sendData(res, subscription);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const subscription = await service.getSubscription(id);
  sendData(res, subscription);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const input = updateSubscriptionSchema.parse(req.body);
  const subscription = await service.updateSubscription(id, input);
  sendData(res, subscription);
}

export async function createFromTemplate(req: Request, res: Response): Promise<void> {
  const input = fromTemplateSchema.parse(req.body);
  const subscription = await service.createSubscriptionFromTemplate(input);
  sendData(res, subscription);
}

export async function transition(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const { to } = transitionSchema.parse(req.body);
  const subscription = await service.transitionSubscription(id, to);
  sendData(res, subscription);
}

export async function pause(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const subscription = await service.pauseSubscription(id);
  sendData(res, subscription);
}

export async function resume(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const subscription = await service.resumeSubscription(id);
  sendData(res, subscription);
}

export async function renew(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const subscription = await service.renewSubscription(id);
  sendData(res, subscription);
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid id");
  }
  return id;
}

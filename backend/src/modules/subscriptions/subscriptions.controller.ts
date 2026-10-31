import { Request, Response } from "express";

export async function list(_req: Request, _res: Response): Promise<void> {}
export async function create(_req: Request, _res: Response): Promise<void> {}
export async function getOne(_req: Request, _res: Response): Promise<void> {}
export async function update(_req: Request, _res: Response): Promise<void> {}
export async function createFromTemplate(_req: Request, _res: Response): Promise<void> {}
export async function transition(_req: Request, _res: Response): Promise<void> {}
export async function pause(_req: Request, _res: Response): Promise<void> {}
export async function resume(_req: Request, _res: Response): Promise<void> {}
export async function renew(_req: Request, _res: Response): Promise<void> {}

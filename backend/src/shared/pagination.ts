import { Request } from "express";

export type ParsedPagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  sort: string;
  order: "asc" | "desc";
};

export function parsePagination(query: Request["query"]): ParsedPagination {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize ?? "20"), 10) || 20));
  const sort = typeof query.sort === "string" && query.sort.length > 0 ? query.sort : "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
    sort,
    order,
  };
}

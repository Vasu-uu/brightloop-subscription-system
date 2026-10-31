import { useCallback, useEffect, useState } from "react";
import { ApiMeta } from "../types";

type Fetcher<T, F> = (args: { page: number; search?: string } & F) => Promise<{ data: T[]; meta: ApiMeta }>;

export function usePagedList<T, F extends Record<string, unknown> = Record<string, never>>(
  fetcher: Fetcher<T, F>,
  filters: F = {} as F
) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [search, filterKey]);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      fetcher({ page, search: search || undefined, ...filters })
        .then((res) => {
          setRows(res.data);
          setTotal(res.meta.total);
        })
        .catch(() => {
          setRows([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterKey, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { rows, total, page, setPage, search, setSearch, loading, reload };
}

import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import { User } from "../types";

export function useMe() {
  const [me, setMe] = useState<User | null>(null);
  useEffect(() => {
    apiGet<User>("/auth/me")
      .then((r) => setMe(r.data))
      .catch(() => setMe(null));
  }, []);
  return me;
}

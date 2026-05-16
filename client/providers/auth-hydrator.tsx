"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { apiGet } from "@/lib/api";
import { tokenStorage } from "@/lib/storage";
import type { User } from "@/lib/types";

export function AuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setHydrated(true);
      return;
    }
    apiGet<User>("/users/me")
      .then((user) => setUser(user))
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setHydrated(true));
  }, [setUser, setHydrated]);

  return null;
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiDelete, apiPut, getErrorMessage } from "@/lib/api";
import type { Role, User } from "@/lib/types";

export interface UsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
}

export function useUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: ["users", query],
    queryFn: async () => {
      const res = await api.get("/users", { params: query });
      return {
        items: res.data?.data as User[],
        meta: res.data?.meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserByAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) =>
      apiPut<User>(`/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update user")),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete user")),
  });
}

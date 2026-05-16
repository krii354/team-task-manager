"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost, getErrorMessage } from "@/lib/api";
import type { Comment } from "@/lib/types";

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => apiGet<Comment[]>(`/comments/${taskId}`),
    enabled: !!taskId,
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiPost<Comment>("/comments", { content, taskId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to post comment")),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/comments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
      toast.success("Comment deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete comment")),
  });
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiDelete, apiGet, apiPost, apiPut, getErrorMessage } from "@/lib/api";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

export interface TasksQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assignedToId?: string;
  overdue?: boolean;
}

export function useTasks(query: TasksQuery = {}) {
  return useQuery({
    queryKey: ["tasks", query],
    queryFn: async () => {
      const res = await api.get("/tasks", { params: query });
      return {
        items: res.data?.data as Task[],
        meta: res.data?.meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => apiGet<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
}

interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  projectId: string;
  assignedToId?: string | null;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => apiPost<Task>("/tasks", payload),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects", task.projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create task")),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateTaskPayload> & { order?: number }) =>
      apiPut<Task>(`/tasks/${id}`, payload),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
      qc.invalidateQueries({ queryKey: ["projects", task.projectId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update task")),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete task")),
  });
}

export function useUploadTaskAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/tasks/${taskId}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
      toast.success("File uploaded");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Upload failed")),
  });
}

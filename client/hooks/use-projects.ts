"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiDelete, apiGet, apiPost, apiPut, getErrorMessage } from "@/lib/api";
import type { Project, ProjectStatus } from "@/lib/types";

export interface ProjectsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus;
}

interface ProjectsListResponse {
  items: Project[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useProjects(query: ProjectsQuery = {}) {
  return useQuery({
    queryKey: ["projects", query],
    queryFn: async () => {
      const res = await api.get("/projects", { params: query });
      return {
        items: res.data?.data as Project[],
        meta: res.data?.meta,
      } as ProjectsListResponse;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => apiGet<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

interface CreateProjectPayload {
  title: string;
  description?: string;
  status?: ProjectStatus;
  deadline?: string;
  color?: string;
  memberIds?: string[];
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => apiPost<Project>("/projects", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Project created");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create project")),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateProjectPayload>) => apiPut<Project>(`/projects/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", id] });
      toast.success("Project updated");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update project")),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Project deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete project")),
  });
}

export function useAddProjectMembers(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberIds: string[]) => apiPost<Project>(`/projects/${projectId}/members`, { memberIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Members added");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to add members")),
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiDelete<null>(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to remove member")),
  });
}

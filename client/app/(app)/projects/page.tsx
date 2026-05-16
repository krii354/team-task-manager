"use client";

import { useState } from "react";
import { FolderPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useProjects } from "@/hooks/use-projects";
import { useAuthStore } from "@/store/auth.store";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const { data, isLoading } = useProjects({
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    pageSize: 50,
  });

  const projects = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage initiatives, track progress, and align your team.
          </p>
        </div>
        {isAdmin && (
          <Button variant="gradient" onClick={() => setOpen(true)}>
            <FolderPlus className="h-4 w-4" /> New project
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-8 w-8" />}
          title="No projects yet"
          description={isAdmin ? "Create your first project to get started." : "You haven't been added to any project yet."}
          action={isAdmin ? <Button variant="gradient" onClick={() => setOpen(true)}><FolderPlus className="h-4 w-4" /> Create project</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={i * 0.04} />
          ))}
        </div>
      )}

      <ProjectFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

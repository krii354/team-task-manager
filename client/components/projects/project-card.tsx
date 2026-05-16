"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, Users2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        href={`/projects/${project.id}`}
        className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="h-10 w-10 shrink-0 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${project.color ?? "#6366f1"}, ${project.color ?? "#6366f1"}aa)` }}
            />
            <div className="min-w-0">
              <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {project.description ?? "No description"}
              </p>
            </div>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress ?? 0}%</span>
          </div>
          <Progress value={project.progress ?? 0} />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users2 className="h-3.5 w-3.5" />
            {project._count?.members ?? project.members.length} members
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {project.deadline ? formatDate(project.deadline) : "No deadline"}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

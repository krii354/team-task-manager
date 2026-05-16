export type Role = "ADMIN" | "MEMBER";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

export type ActivityAction =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "ATTACHMENT_ADDED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null;
  color: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  members: ProjectMember[];
  progress?: number;
  stats?: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
  };
  _count?: { tasks: number; members: number };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatar">;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  taskId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  order: number;
  projectId: string;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignedTo?: Pick<User, "id" | "name" | "email" | "avatar"> | null;
  createdBy?: Pick<User, "id" | "name" | "email" | "avatar">;
  project?: Pick<Project, "id" | "title" | "color">;
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: ActivityItem[];
  _count?: { comments: number; attachments: number };
}

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  metadata?: Record<string, unknown> | null;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  createdAt: string;
  user: Pick<User, "id" | "name" | "avatar"> & { email?: string };
  project?: Pick<Project, "id" | "title"> | null;
  task?: Pick<Task, "id" | "title"> | null;
}

export interface DashboardData {
  cards: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalMembers: number;
    productivity: number;
  };
  statusBreakdown: { todo: number; inProgress: number; review: number; completed: number };
  priorityBreakdown: { priority: TaskPriority; count: number }[];
  completionTrend: { month: string; completed: number }[];
  recentActivities: ActivityItem[];
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

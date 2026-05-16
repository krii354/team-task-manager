/* eslint-disable no-console */
import { PrismaClient, ProjectStatus, Role, TaskPriority, TaskStatus, ActivityAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskmanager.dev" },
    update: {},
    create: {
      name: "Alex Admin",
      email: "admin@taskmanager.dev",
      password,
      role: Role.ADMIN,
      bio: "Engineering manager and project lead.",
    },
  });

  const memberData = [
    { name: "Maya Patel", email: "maya@taskmanager.dev", bio: "Frontend engineer" },
    { name: "Jordan Lee", email: "jordan@taskmanager.dev", bio: "Backend engineer" },
    { name: "Sam Rivera", email: "sam@taskmanager.dev", bio: "Product designer" },
    { name: "Priya Singh", email: "priya@taskmanager.dev", bio: "QA engineer" },
  ];

  const members = await Promise.all(
    memberData.map((m) =>
      prisma.user.upsert({
        where: { email: m.email },
        update: {},
        create: { ...m, password, role: Role.MEMBER },
      }),
    ),
  );

  const project1 = await prisma.project.create({
    data: {
      title: "Mobile App Redesign",
      description: "Complete overhaul of the mobile experience with new design system and accessibility upgrades.",
      status: ProjectStatus.ACTIVE,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      color: "#6366f1",
      ownerId: admin.id,
      members: { create: members.map((m) => ({ userId: m.id })) },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: "Marketing Website 2.0",
      description: "Launch a high-performance marketing site with refreshed branding and a new CMS pipeline.",
      status: ProjectStatus.PLANNING,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      color: "#10b981",
      ownerId: admin.id,
      members: { create: [{ userId: members[0].id }, { userId: members[2].id }] },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: "Internal Analytics Platform",
      description: "Self-serve dashboards for product, growth and operations teams.",
      status: ProjectStatus.ACTIVE,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      color: "#f59e0b",
      ownerId: admin.id,
      members: { create: [{ userId: members[1].id }, { userId: members[3].id }] },
    },
  });

  const tasksSpec: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueOffsetDays: number;
    projectId: string;
    assigneeId: string;
  }> = [
    { title: "Design system tokens", description: "Define spacing, color, typography tokens.", priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueOffsetDays: 5, projectId: project1.id, assigneeId: members[2].id },
    { title: "Login screen redesign", description: "Implement new login flow with biometrics.", priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueOffsetDays: 10, projectId: project1.id, assigneeId: members[0].id },
    { title: "Onboarding flow A/B test", description: "Set up Optimizely experiment.", priority: TaskPriority.LOW, status: TaskStatus.TODO, dueOffsetDays: 14, projectId: project1.id, assigneeId: members[0].id },
    { title: "API auth refactor", description: "Move to JWT with refresh tokens.", priority: TaskPriority.CRITICAL, status: TaskStatus.REVIEW, dueOffsetDays: 2, projectId: project1.id, assigneeId: members[1].id },
    { title: "Push notifications", description: "Integrate Firebase Cloud Messaging.", priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, dueOffsetDays: -3, projectId: project1.id, assigneeId: members[1].id },

    { title: "Choose CMS provider", description: "Evaluate Sanity vs Contentful.", priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueOffsetDays: 4, projectId: project2.id, assigneeId: members[2].id },
    { title: "Hero section variants", description: "3 candidates with motion.", priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueOffsetDays: 8, projectId: project2.id, assigneeId: members[2].id },
    { title: "Pricing calculator", description: "Interactive calculator on /pricing.", priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueOffsetDays: 12, projectId: project2.id, assigneeId: members[0].id },

    { title: "ETL pipeline scaffolding", description: "Bootstrap Airflow with sample DAGs.", priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueOffsetDays: 6, projectId: project3.id, assigneeId: members[1].id },
    { title: "Dashboard data model", description: "Define metrics warehouse schema.", priority: TaskPriority.CRITICAL, status: TaskStatus.TODO, dueOffsetDays: -1, projectId: project3.id, assigneeId: members[1].id },
    { title: "Cohort retention chart", description: "Recharts cohort visualization.", priority: TaskPriority.MEDIUM, status: TaskStatus.REVIEW, dueOffsetDays: 9, projectId: project3.id, assigneeId: members[3].id },
    { title: "Access control audit", description: "Map role permissions to API routes.", priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, dueOffsetDays: -7, projectId: project3.id, assigneeId: members[3].id },
  ];

  for (const [i, t] of tasksSpec.entries()) {
    const completedAt = t.status === TaskStatus.COMPLETED ? new Date(Date.now() + t.dueOffsetDays * 24 * 60 * 60 * 1000) : null;
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        dueDate: new Date(Date.now() + t.dueOffsetDays * 24 * 60 * 60 * 1000),
        projectId: t.projectId,
        assignedToId: t.assigneeId,
        createdById: admin.id,
        order: i,
        completedAt,
      },
    });

    if (i % 3 === 0) {
      await prisma.comment.create({
        data: {
          content: "Kicking this off — will share an update by Friday.",
          taskId: task.id,
          userId: t.assigneeId,
        },
      });
    }

    await prisma.activity.create({
      data: {
        action: ActivityAction.TASK_CREATED,
        userId: admin.id,
        projectId: t.projectId,
        taskId: task.id,
        metadata: { title: task.title },
      },
    });
  }

  console.log("Seeding complete.");
  console.log("Admin login:  admin@taskmanager.dev  /  Password123");
  console.log("Member login: maya@taskmanager.dev  /  Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

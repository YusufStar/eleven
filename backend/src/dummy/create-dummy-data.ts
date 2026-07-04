import { faker } from "@faker-js/faker";
import { prisma } from "../db/prisma";
import { TaskStatus, TaskPriority } from "../../prisma/generated/prisma/enums";

const TARGET_EMAIL = "07yusufstar@gmail.com";
const TARGET_ORG_SLUG = "star-tech";

const LABELS = ["frontend", "backend", "bug", "design", "infra", "docs", "research"];

export async function createDummyData(): Promise<{ ok: boolean; message: string; counts?: Record<string, number> }> {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    return { ok: false, message: `User not found: ${TARGET_EMAIL}` };
  }

  const org = await prisma.organization.findUnique({ where: { slug: TARGET_ORG_SLUG } });
  if (!org) {
    return { ok: false, message: `Organization not found: ${TARGET_ORG_SLUG}` };
  }

  const member = await prisma.member.findFirst({
    where: { organizationId: org.id, userId: user.id },
  });
  if (!member) {
    return { ok: false, message: `Member not found for ${TARGET_EMAIL} in org ${TARGET_ORG_SLUG}` };
  }

  const orgId = org.id;
  const ownerId = member.id;

  faker.seed(42);

  // ─── Sprints ────────────────────────────────────────────────────────────
  const now = new Date();
  const sprints: { id: string }[] = [];
  for (let i = -2; i <= 1; i++) {
    const startsAt = new Date(now);
    startsAt.setDate(startsAt.getDate() + i * 14);
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + 13);
    const s = await prisma.sprint.create({
      data: {
        organizationId: orgId,
        name: `Sprint ${10 + i}`,
        goal: faker.company.catchPhrase(),
        startsAt,
        endsAt,
      },
    });
    sprints.push({ id: s.id });
  }

  // ─── Projects, members & milestones ─────────────────────────────────────
  const projectNames = [
    "Website Redesign",
    "Mobile App MVP",
    "Realtime Chat",
    "AI Reports",
    "Internal Dashboard",
  ];
  const projects: { id: string }[] = [];
  let milestoneCount = 0;
  for (const name of projectNames) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const proj = await prisma.project.create({
      data: {
        organizationId: orgId,
        name,
        slug: `${slug}-${faker.string.alphanumeric(4)}`,
        description: faker.lorem.paragraph(),
        links: [
          { title: "Figma", url: faker.internet.url() },
          { title: "GitHub", url: faker.internet.url() },
        ] as unknown as Parameters<typeof prisma.project.create>[0]["data"]["links"],
      },
    });
    await prisma.projectMember.create({
      data: { projectId: proj.id, memberId: ownerId },
    });
    for (const msName of ["Beta launch", "GA release"]) {
      await prisma.milestone.create({
        data: {
          projectId: proj.id,
          name: msName,
          dueAt: faker.date.soon({ days: 90 }),
        },
      });
      milestoneCount++;
    }
    projects.push({ id: proj.id });
  }

  // ─── Tasks (assignee = target user) ────────────────────────────────────
  const taskCount = faker.number.int({ min: 35, max: 60 });
  const taskTitles = [
    "Review design mockups",
    "Update API documentation",
    "Prepare sprint demo",
    "Fix login bug",
    "Write unit tests",
    "Sync with stakeholder",
    "Deploy to staging",
    "Code review",
    "Update dependencies",
    "Refactor auth module",
  ];
  for (let i = 0; i < taskCount; i++) {
    const project = faker.datatype.boolean(0.85) ? faker.helpers.arrayElement(projects) : null;
    const sprint = faker.datatype.boolean(0.6) ? faker.helpers.arrayElement(sprints) : null;
    const status = faker.helpers.arrayElement(Object.values(TaskStatus));
    await prisma.task.create({
      data: {
        organizationId: orgId,
        title: faker.helpers.arrayElement(taskTitles),
        description: faker.datatype.boolean(0.5) ? faker.lorem.sentences(2) : null,
        status,
        priority: faker.helpers.arrayElement(Object.values(TaskPriority)),
        labels: faker.helpers.arrayElements(LABELS, { min: 0, max: 3 }),
        estimate: faker.datatype.boolean(0.7) ? faker.helpers.arrayElement([1, 2, 3, 5, 8, 13]) : null,
        dueAt: faker.datatype.boolean(0.7) ? faker.date.soon({ days: 21 }) : null,
        completedAt: status === TaskStatus.DONE ? faker.date.recent({ days: 10 }) : null,
        assigneeId: ownerId,
        creatorId: ownerId,
        projectId: project?.id ?? null,
        sprintId: sprint?.id ?? null,
      },
    });
  }

  return {
    ok: true,
    message: `Dummy data created for ${TARGET_EMAIL} / ${TARGET_ORG_SLUG}`,
    counts: {
      sprints: sprints.length,
      projects: projects.length,
      milestones: milestoneCount,
      tasks: taskCount,
    },
  };
}

import { faker } from "@faker-js/faker";
import { prisma } from "../db/prisma";
import {
  ContactType,
  ContactStatus,
  ContactSource,
  ActivityType,
  DealStatus,
  TaskStatus,
  TaskPriority,
} from "../../prisma/generated/prisma/enums";

const TARGET_EMAIL = "07yusufstar@gmail.com";
const TARGET_ORG_SLUG = "star-tech";

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

  // ─── Contacts: Companies first ─────────────────────────────────────────
  const companyCount = faker.number.int({ min: 10, max: 18 });
  const companies: { id: string }[] = [];
  for (let i = 0; i < companyCount; i++) {
    const companyName = faker.company.name();
    const c = await prisma.contact.create({
      data: {
        organizationId: orgId,
        type: ContactType.COMPANY,
        status: faker.helpers.arrayElement([
          ContactStatus.LEAD,
          ContactStatus.PROSPECT,
          ContactStatus.CUSTOMER,
          ContactStatus.PARTNER,
        ]),
        source: faker.helpers.arrayElement(Object.values(ContactSource)),
        avatar: faker.image.urlLoremFlickr({ category: "business" }),
        firstName: companyName,
        lastName: null,
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        title: null,
        companyName,
        website: faker.internet.url(),
        industry: faker.commerce.department(),
        employeeCount: faker.helpers.arrayElement([null, 5, 12, 50, 200, 1000]),
        country: faker.location.country(),
        city: faker.location.city(),
        address: faker.location.streetAddress(),
        ownerId: ownerId,
        notes: faker.datatype.boolean(0.3) ? faker.lorem.paragraph() : null,
        tags: faker.helpers.arrayElements(["enterprise", "startup", "partner", "key-account"], { min: 0, max: 2 }),
      },
    });
    companies.push({ id: c.id });
  }

  // ─── Contacts: People (some linked to companies) ────────────────────────
  const peopleCount = faker.number.int({ min: 25, max: 45 });
  const people: { id: string }[] = [];
  for (let i = 0; i < peopleCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const company = faker.datatype.boolean(0.6) ? faker.helpers.arrayElement(companies) : null;
    const c = await prisma.contact.create({
      data: {
        organizationId: orgId,
        type: ContactType.PERSON,
        status: faker.helpers.arrayElement(Object.values(ContactStatus)),
        source: faker.helpers.arrayElement(Object.values(ContactSource)),
        avatar: faker.image.avatar(),
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number(),
        title: faker.person.jobTitle(),
        companyName: null,
        website: null,
        industry: null,
        employeeCount: null,
        companyId: company?.id ?? null,
        country: faker.location.country(),
        city: faker.location.city(),
        address: faker.datatype.boolean(0.4) ? faker.location.streetAddress() : null,
        ownerId: ownerId,
        notes: faker.datatype.boolean(0.25) ? faker.lorem.sentence() : null,
        tags: faker.helpers.arrayElements(["decision-maker", "technical", "follow-up"], { min: 0, max: 2 }),
      },
    });
    people.push({ id: c.id });
  }

  // ─── Pipelines & Stages ────────────────────────────────────────────────
  const pipeline1 = await prisma.pipeline.create({
    data: {
      organizationId: orgId,
      name: "Sales Pipeline",
      isDefault: true,
    },
  });
  const stageNames1 = ["Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  const stages1: { id: string; pipelineId: string }[] = [];
  for (let i = 0; i < stageNames1.length; i++) {
    const s = await prisma.stage.create({
      data: {
        pipelineId: pipeline1.id,
        name: stageNames1[i],
        order: i + 1,
        color: faker.helpers.arrayElement(["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#6b7280"]),
      },
    });
    stages1.push({ id: s.id, pipelineId: pipeline1.id });
  }

  const pipeline2 = await prisma.pipeline.create({
    data: {
      organizationId: orgId,
      name: "Partnership Pipeline",
      isDefault: false,
    },
  });
  const stageNames2 = ["Lead", "Meeting", "Contract", "Active"];
  const stages2: { id: string; pipelineId: string }[] = [];
  for (let i = 0; i < stageNames2.length; i++) {
    const s = await prisma.stage.create({
      data: {
        pipelineId: pipeline2.id,
        name: stageNames2[i],
        order: i + 1,
        color: faker.helpers.arrayElement(["#8b5cf6", "#ec4899", "#14b8a6"]),
      },
    });
    stages2.push({ id: s.id, pipelineId: pipeline2.id });
  }

  const allStages = [...stages1, ...stages2];

  // ─── Deals ────────────────────────────────────────────────────────────
  const dealCount = faker.number.int({ min: 18, max: 35 });
  const deals: { id: string }[] = [];
  for (let i = 0; i < dealCount; i++) {
    const stage = faker.helpers.arrayElement(allStages);
    const contact = faker.datatype.boolean(0.8) ? faker.helpers.arrayElement([...companies, ...people]) : null;
    const d = await prisma.deal.create({
      data: {
        organizationId: orgId,
        title: `${faker.company.buzzNoun()} - ${faker.company.name()}`,
        value: faker.number.float({ min: 5_000, max: 500_000, fractionDigits: 2 }),
        currency: "TRY",
        probability: faker.number.int({ min: 10, max: 90 }),
        expectedClose: faker.date.soon({ days: 60 }),
        status: faker.helpers.arrayElement([DealStatus.OPEN, DealStatus.OPEN, DealStatus.WON, DealStatus.LOST]),
        lostReason: null,
        contactId: contact?.id ?? null,
        stageId: stage.id,
        pipelineId: stage.pipelineId,
        ownerId: ownerId,
      },
    });
    deals.push({ id: d.id });
  }

  // ─── Activities ────────────────────────────────────────────────────────
  const activityCount = faker.number.int({ min: 40, max: 70 });
  for (let i = 0; i < activityCount; i++) {
    await prisma.activity.create({
      data: {
        organizationId: orgId,
        type: faker.helpers.arrayElement(Object.values(ActivityType)),
        title: faker.helpers.arrayElement([
          "Follow-up call",
          "Send proposal",
          "Demo scheduled",
          "Contract review",
          "Discovery meeting",
          faker.lorem.sentence(),
        ]),
        description: faker.datatype.boolean(0.5) ? faker.lorem.paragraph() : null,
        dueAt: faker.date.soon({ days: 14 }),
        completedAt: faker.datatype.boolean(0.4) ? faker.date.recent({ days: 7 }) : null,
        isDone: faker.datatype.boolean(0.4),
        contactId: faker.datatype.boolean(0.6) ? faker.helpers.arrayElement(people).id : null,
        dealId: faker.datatype.boolean(0.5) && deals.length ? faker.helpers.arrayElement(deals).id : null,
        ownerId: ownerId,
      },
    });
  }

  // ─── Projects & Project Members ─────────────────────────────────────────
  const projectNames = [
    "Website Redesign",
    "Mobile App MVP",
    "CRM Integration",
    "Marketing Automation",
    "Internal Dashboard",
  ];
  const projects: { id: string }[] = [];
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
    const contact = faker.datatype.boolean(0.2) ? faker.helpers.arrayElement(people) : null;
    const deal = faker.datatype.boolean(0.15) && deals.length ? faker.helpers.arrayElement(deals) : null;
    await prisma.task.create({
      data: {
        organizationId: orgId,
        title: faker.helpers.arrayElement(taskTitles),
        description: faker.datatype.boolean(0.5) ? faker.lorem.sentences(2) : null,
        status: faker.helpers.arrayElement(Object.values(TaskStatus)),
        priority: faker.helpers.arrayElement(Object.values(TaskPriority)),
        dueAt: faker.datatype.boolean(0.7) ? faker.date.soon({ days: 21 }) : null,
        completedAt: faker.datatype.boolean(0.25) ? faker.date.recent({ days: 5 }) : null,
        assigneeId: ownerId,
        creatorId: ownerId,
        projectId: project?.id ?? null,
        contactId: contact?.id ?? null,
        dealId: deal?.id ?? null,
      },
    });
  }

  return {
    ok: true,
    message: `Dummy data created for ${TARGET_EMAIL} / ${TARGET_ORG_SLUG}`,
    counts: {
      companies: companyCount,
      people: peopleCount,
      pipelines: 2,
      stages: stages1.length + stages2.length,
      deals: dealCount,
      activities: activityCount,
      projects: projects.length,
      tasks: taskCount,
    },
  };
}

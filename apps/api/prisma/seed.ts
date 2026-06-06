import "dotenv/config";
import bcrypt from "bcrypt";
import { ActivityType, Role, TicketStatus } from "@it-ticketing/shared";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetData() {
  await prisma.ticketActivity.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.ticketTypePipelineStep.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
}

async function main() {
  await resetData();

  const [helpDesk, tier2, infrastructure] = await Promise.all([
    prisma.department.create({
      data: { name: "Help Desk", slug: "help-desk" },
    }),
    prisma.department.create({
      data: { name: "Tier 2 Support", slug: "tier-2-support" },
    }),
    prisma.department.create({
      data: { name: "Infrastructure", slug: "infrastructure" },
    }),
  ]);

  const itHardware = await prisma.ticketType.create({
    data: {
      name: "IT Hardware",
      description: "Laptops, peripherals, and hardware replacements",
    },
  });

  const softwareRequest = await prisma.ticketType.create({
    data: {
      name: "Software Request",
      description: "Application installs and license requests",
    },
  });

  const networkIncident = await prisma.ticketType.create({
    data: {
      name: "Network Incident",
      description: "Connectivity and outage reports",
    },
  });

  const hardwarePipeline = [
    { ticketTypeId: itHardware.id, departmentId: helpDesk.id, stepOrder: 0 },
    { ticketTypeId: itHardware.id, departmentId: tier2.id, stepOrder: 1 },
    {
      ticketTypeId: itHardware.id,
      departmentId: infrastructure.id,
      stepOrder: 2,
    },
  ];

  const softwarePipeline = [
    {
      ticketTypeId: softwareRequest.id,
      departmentId: helpDesk.id,
      stepOrder: 0,
    },
    { ticketTypeId: softwareRequest.id, departmentId: tier2.id, stepOrder: 1 },
  ];

  const networkPipeline = [
    {
      ticketTypeId: networkIncident.id,
      departmentId: helpDesk.id,
      stepOrder: 0,
    },
    { ticketTypeId: networkIncident.id, departmentId: tier2.id, stepOrder: 1 },
    {
      ticketTypeId: networkIncident.id,
      departmentId: infrastructure.id,
      stepOrder: 2,
    },
  ];

  await prisma.ticketTypePipelineStep.createMany({
    data: [...hardwarePipeline, ...softwarePipeline, ...networkPipeline],
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const memberDefs = [
    { email: "alice@helpdesk.local", name: "Alice Chen", dept: helpDesk.id },
    { email: "bob@helpdesk.local", name: "Bob Reyes", dept: helpDesk.id },
    { email: "carol@tier2.local", name: "Carol Lim", dept: tier2.id },
    { email: "dave@tier2.local", name: "Dave Park", dept: tier2.id },
    { email: "eve@infra.local", name: "Eve Santos", dept: infrastructure.id },
    { email: "frank@infra.local", name: "Frank Wu", dept: infrastructure.id },
  ];

  const members = await Promise.all(
    memberDefs.map((m) =>
      prisma.user.create({
        data: {
          email: m.email,
          name: m.name,
          passwordHash,
          role: Role.DEPARTMENT_MEMBER,
          departmentId: m.dept,
        },
      }),
    ),
  );

  const [alice, bob, carol, dave, eve] = members;

  const endUsers = await Promise.all(
    ["jordan@company.local", "sam@company.local", "sean@company.local"].map(
      (email, i) =>
        prisma.user.create({
          data: {
            email,
            name: i === 0 ? "Jordan Lee" : i === 1 ? "Sam Ortiz" : "Sean Comingues",
            passwordHash,
            role: Role.END_USER,
            departmentId: helpDesk.id,
          },
        }),
    ),
  );

  const [jordan, sam] = endUsers;

  async function seedTicket(opts: {
    title: string;
    description: string;
    ticketTypeId: string;
    createdById: string;
    currentDepartmentId: string;
    pipelineStepIndex: number;
    status: TicketStatus;
    assigneeId?: string;
    activities: {
      type: ActivityType;
      actorId: string;
      message?: string;
      targetUserId?: string;
      targetDepartmentId?: string;
      sourceDepartmentId?: string;
      previousStatus?: TicketStatus;
      newStatus?: TicketStatus;
    }[];
  }) {
    const ticket = await prisma.ticket.create({
      data: {
        title: opts.title,
        description: opts.description,
        ticketTypeId: opts.ticketTypeId,
        createdById: opts.createdById,
        currentDepartmentId: opts.currentDepartmentId,
        pipelineStepIndex: opts.pipelineStepIndex,
        status: opts.status,
        assigneeId: opts.assigneeId,
      },
    });

    for (const activity of opts.activities) {
      await prisma.ticketActivity.create({
        data: { ticketId: ticket.id, ...activity },
      });
    }

    return ticket;
  }

  await seedTicket({
    title: "Laptop fan noise",
    description: "MacBook fan runs loudly after OS update.",
    ticketTypeId: itHardware.id,
    createdById: jordan.id,
    currentDepartmentId: helpDesk.id,
    pipelineStepIndex: 0,
    status: TicketStatus.OPEN,
    activities: [
      {
        type: ActivityType.TICKET_CREATED,
        actorId: jordan.id,
        targetDepartmentId: helpDesk.id,
        newStatus: TicketStatus.OPEN,
      },
    ],
  });

  await seedTicket({
    title: "Install Adobe Creative Cloud",
    description: "Need CC for marketing team workstation.",
    ticketTypeId: softwareRequest.id,
    createdById: sam.id,
    currentDepartmentId: helpDesk.id,
    pipelineStepIndex: 0,
    status: TicketStatus.IN_PROGRESS,
    assigneeId: bob.id,
    activities: [
      {
        type: ActivityType.TICKET_CREATED,
        actorId: sam.id,
        targetDepartmentId: helpDesk.id,
        newStatus: TicketStatus.OPEN,
      },
      {
        type: ActivityType.ASSIGNED,
        actorId: alice.id,
        targetUserId: bob.id,
        message: "Assigned to Bob Reyes",
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.IN_PROGRESS,
      },
    ],
  });

  await seedTicket({
    title: "VPN drops hourly",
    description: "Remote staff lose VPN connection around :30 each hour.",
    ticketTypeId: networkIncident.id,
    createdById: jordan.id,
    currentDepartmentId: tier2.id,
    pipelineStepIndex: 1,
    status: TicketStatus.ESCALATED,
    activities: [
      {
        type: ActivityType.TICKET_CREATED,
        actorId: jordan.id,
        targetDepartmentId: helpDesk.id,
        newStatus: TicketStatus.OPEN,
      },
      {
        type: ActivityType.ESCALATED,
        actorId: alice.id,
        targetDepartmentId: tier2.id,
        sourceDepartmentId: helpDesk.id,
        message: "Initial triage complete — needs Tier 2 network analysis.",
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.ESCALATED,
      },
    ],
  });

  await seedTicket({
    title: "Replace server rack UPS",
    description: "UPS battery failed in rack B2.",
    ticketTypeId: itHardware.id,
    createdById: sam.id,
    currentDepartmentId: infrastructure.id,
    pipelineStepIndex: 2,
    status: TicketStatus.IN_PROGRESS,
    assigneeId: eve.id,
    activities: [
      {
        type: ActivityType.TICKET_CREATED,
        actorId: sam.id,
        targetDepartmentId: helpDesk.id,
        newStatus: TicketStatus.OPEN,
      },
      {
        type: ActivityType.ESCALATED,
        actorId: bob.id,
        targetDepartmentId: tier2.id,
        sourceDepartmentId: helpDesk.id,
        message: "Hardware fault confirmed.",
        previousStatus: TicketStatus.IN_PROGRESS,
        newStatus: TicketStatus.ESCALATED,
      },
      {
        type: ActivityType.ESCALATED,
        actorId: carol.id,
        targetDepartmentId: infrastructure.id,
        sourceDepartmentId: tier2.id,
        message: "Escalating for datacenter work.",
        previousStatus: TicketStatus.ESCALATED,
        newStatus: TicketStatus.ESCALATED,
      },
      {
        type: ActivityType.ASSIGNED,
        actorId: dave.id,
        targetUserId: eve.id,
        message: "Assigned to Eve Santos",
        previousStatus: TicketStatus.ESCALATED,
        newStatus: TicketStatus.IN_PROGRESS,
      },
    ],
  });

  await seedTicket({
    title: "Closed: dock station replacement",
    description: "Dock replaced under warranty.",
    ticketTypeId: itHardware.id,
    createdById: jordan.id,
    currentDepartmentId: helpDesk.id,
    pipelineStepIndex: 0,
    status: TicketStatus.CLOSED,
    assigneeId: alice.id,
    activities: [
      {
        type: ActivityType.TICKET_CREATED,
        actorId: jordan.id,
        targetDepartmentId: helpDesk.id,
        newStatus: TicketStatus.OPEN,
      },
      {
        type: ActivityType.ASSIGNED,
        actorId: bob.id,
        targetUserId: alice.id,
        message: "Assigned to Alice Chen",
        previousStatus: TicketStatus.OPEN,
        newStatus: TicketStatus.IN_PROGRESS,
      },
      {
        type: ActivityType.STATUS_CHANGED,
        actorId: alice.id,
        previousStatus: TicketStatus.IN_PROGRESS,
        newStatus: TicketStatus.RESOLVED,
      },
      {
        type: ActivityType.STATUS_CHANGED,
        actorId: alice.id,
        previousStatus: TicketStatus.RESOLVED,
        newStatus: TicketStatus.CLOSED,
      },
    ],
  });

  console.log("Seed complete (take-home spec):");
  console.log("  Departments: Help Desk → Tier 2 Support → Infrastructure");
  console.log(
    "  Ticket types: IT Hardware, Software Request, Network Incident",
  );
  console.log("  Members: 2 per department (alice/bob, carol/dave, eve/frank)");
  console.log("  End users: jordan@company.local, sam@company.local");
  console.log(
    "  Sample tickets: 5 across OPEN / IN_PROGRESS / ESCALATED / CLOSED",
  );
  console.log("  Password for all accounts: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

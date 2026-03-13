/**
 * Seed script — inserts test data for all roles.
 *
 * Accounts created:
 *   admin@test.com          / Admin@123      — role: admin
 *   leader@test.com         / Leader@123     — role: organization_leader
 *   member@test.com         / Member@123     — role: organization_member
 *   student@test.com        / Student@123    — role: student
 *
 * Also creates:
 *   - 1 organization (Tech Club)
 *   - 1 activity
 *   - 1 open form with 3 questions
 *
 * Run: node environment/database/seed.js
 */

require("dotenv").config({ path: "./backend/.env" });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── 1. Roles ────────────────────────────────────────────────────────────────
  const roleCodes = ["admin", "student", "organization_leader", "organization_member"];
  const roles = {};

  for (const code of roleCodes) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, roleName: code.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
    });
    roles[code] = role;
    console.log(`  Role: ${code} (id=${role.roleId})`);
  }

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  const usersData = [
    { userName: "Admin User",            email: "admin@test.com",   password: "Admin@123",   role: "admin",                university: "Test University" },
    { userName: "Organization Leader",   email: "leader@test.com",  password: "Leader@123",  role: "organization_leader", university: "Test University" },
    { userName: "Organization Member",   email: "member@test.com",  password: "Member@123",  role: "organization_member", university: "Test University" },
    { userName: "Student User",          email: "student@test.com", password: "Student@123", role: "student",             university: "Test University" },
  ];

  const users = {};

  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 12);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        userName:   u.userName,
        email:      u.email,
        password:   hashed,
        university: u.university,
        status:     "active",
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.userId, roleId: roles[u.role].roleId } },
      update: {},
      create: { userId: user.userId, roleId: roles[u.role].roleId },
    });

    users[u.role] = user;
    console.log(`  User: ${u.email} (id=${user.userId}, role=${u.role})`);
  }

  // ── 3. Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where:  { organizationId: 1 },
    update: {},
    create: {
      organizationName: "Tech Club",
      organizationType: "club",
      description:      "A club for tech enthusiasts.",
      createdBy:        users["admin"].userId,
    },
  });
  console.log(`  Organization: ${org.organizationName} (id=${org.organizationId})`);

  // Add leader and member to organization
  await prisma.organizationMember.upsert({
    where:  { userId_organizationId: { userId: users["organization_leader"].userId, organizationId: org.organizationId } },
    update: {},
    create: { userId: users["organization_leader"].userId, organizationId: org.organizationId, role: "president" },
  });

  await prisma.organizationMember.upsert({
    where:  { userId_organizationId: { userId: users["organization_member"].userId, organizationId: org.organizationId } },
    update: {},
    create: { userId: users["organization_member"].userId, organizationId: org.organizationId, role: "member" },
  });

  // ── 4. Activity Category ─────────────────────────────────────────────────────
  const category = await prisma.activityCategory.upsert({
    where:  { categoryName: "Technology" },
    update: {},
    create: { categoryName: "Technology", createdBy: users["admin"].userId },
  });
  console.log(`  Category: ${category.categoryName} (id=${category.categoryId})`);

  // ── 5. Activity ──────────────────────────────────────────────────────────────
  const existingActivity = await prisma.activity.findFirst({ where: { activityName: "Tech Hackathon 2026" } });
  let activity;
  if (!existingActivity) {
    activity = await prisma.activity.create({
      data: {
        activityName:        "Tech Hackathon 2026",
        location:            "Main Hall, Building A",
        activityType:        "competition",
        description:         "Annual hackathon for students. Build something amazing in 24 hours.",
        startTime:           new Date("2026-04-01T08:00:00Z"),
        endTime:             new Date("2026-04-02T08:00:00Z"),
        registrationDeadline: new Date("2026-03-25T23:59:59Z"),
        maxParticipants:     100,
        organizationId:      org.organizationId,
        categoryId:          category.categoryId,
        createdBy:           users["organization_leader"].userId,
      },
    });
    console.log(`  Activity: ${activity.activityName} (id=${activity.activityId})`);
  } else {
    activity = existingActivity;
    console.log(`  Activity: already exists (id=${activity.activityId})`);
  }

  console.log("\nSeed complete.");
  console.log("\nTest accounts:");
  console.log("  admin@test.com          / Admin@123    (admin)");
  console.log("  leader@test.com         / Leader@123   (organization_leader)");
  console.log("  member@test.com         / Member@123   (organization_member)");
  console.log("  student@test.com        / Student@123  (student)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Create or update a team member who can sign in straight away.
 *
 *   NEW_USER_PASSWORD='…' npm run user:create -- <email> "<name>" [Owner|Contributor|Viewer]
 *
 * The password comes from the environment so it never lands in shell history args or git.
 * Targets whatever DATABASE_URL points at (.env locally).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/password";

const [email, name, role = "Owner"] = process.argv.slice(2);
const password = process.env.NEW_USER_PASSWORD;

if (!email || !name || !password) {
  console.error('Usage: NEW_USER_PASSWORD=… npm run user:create -- <email> "<name>" [Owner|Contributor|Viewer]');
  process.exit(1);
}
if (!(ROLES as readonly string[]).includes(role)) {
  console.error(`Role must be one of: ${ROLES.join(", ")}`);
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? process.env.bison_vendor_DATABASE_URL }),
});

async function main() {
  const passwordHash = await hashPassword(password!);
  const address = email!.trim().toLowerCase();
  const member = await prisma.teamMember.upsert({
    where: { email: address },
    create: { email: address, name: name!, role, status: "Active", passwordHash },
    update: { name: name!, role, status: "Active", passwordHash, inviteToken: null },
  });
  console.log(`✔ ${member.name} <${member.email}> is an active ${member.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

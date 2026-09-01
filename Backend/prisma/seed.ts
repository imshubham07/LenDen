import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME ?? "Admin";
  const mobile = process.env.ADMIN_MOBILE ?? "9999999999";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { mobile },
    update: { name, passwordHash },
    create: { name, mobile, passwordHash }
  });

  console.log(`Admin ready: ${mobile}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.USER_NAME;
  const mobile = process.env.USER_MOBILE;
  const password = process.env.USER_PASSWORD;
  if (!name || !mobile || !password) throw new Error("Set USER_NAME, USER_MOBILE and USER_PASSWORD to seed an optional account");
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { mobile },
    update: { name, passwordHash },
    create: { name, mobile, passwordHash }
  });

  console.log(`User ready: ${mobile}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

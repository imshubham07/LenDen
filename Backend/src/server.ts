import { env } from "./config/env";
import { connectRedis, redis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { app } from "./app";

async function bootstrap() {
  await connectRedis();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Backend running on http://0.0.0.0:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

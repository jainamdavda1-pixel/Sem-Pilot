import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './lib/prisma.js';
import { startNotificationScheduler } from './services/scheduler.service.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    // Seed default user if not exists
    await prisma.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: { id: 'default-user', name: 'Default Student' }
    });
    logger.info('Default user verified in database.');

    // Start background notification scheduler
    startNotificationScheduler();

    const port = config.PORT;
    app.listen(port, () => {
      logger.info(`SemPilot Server running in ${config.NODE_ENV} mode on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server or database connection', error);
    process.exit(1);
  }
};

// Handle process termination cleanly
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Closing Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
export default app;

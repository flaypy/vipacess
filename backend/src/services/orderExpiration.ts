import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Expire pending orders that are older than 30 minutes
 */
export async function expirePendingOrders() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
      data: {
        status: 'FAILED',
      },
    });

    if (result.count > 0) {
      console.log(`✓ Expired ${result.count} pending order(s) older than 30 minutes`);
    }

    return result.count;
  } catch (error) {
    console.error('Error expiring pending orders:', error);
    return 0;
  }
}

/**
 * Start the order expiration job
 * Runs every 5 minutes
 */
export function startOrderExpirationJob() {
  console.log('🕐 Starting order expiration job (runs every 5 minutes)');

  // Run immediately on startup
  expirePendingOrders();

  // Then run every 5 minutes
  setInterval(() => {
    expirePendingOrders();
  }, 5 * 60 * 1000); // 5 minutes
}

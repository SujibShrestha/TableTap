import cron from "node-cron";
import { prisma } from "../config/db.js";
import { getIo } from "../utils/socket.js";
import logger from "../config/logger.js";

const SESSION_TIMEOUT_MINUTES = Number(process.env.SESSION_TIMEOUT_MINUTES) || 240;

export function startSessionScheduler() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000);

      const staleSessions = await prisma.tableSession.findMany({
        where: {
          status: "ACTIVE",
          createdAt: { lt: cutoff },
        },
        include: {
          orders: { select: { id: true, paymentStatus: true } },
          payments: { select: { id: true, status: true } },
        },
      });

      for (const session of staleSessions) {
        const hasUnpaidOrders = session.orders.some(
          (o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "AWAITING_PAYMENT"
        );
        const hasUnverifiedPayment = session.payments.some(
          (p) => p.status === "PENDING_VERIFICATION"
        );

        if (hasUnpaidOrders || hasUnverifiedPayment) {
          logger.info(`[Scheduler] Skipping session ${session.id} — has unpaid/unverified items`);
          continue;
        }

        await prisma.tableSession.update({
          where: { id: session.id },
          data: { status: "CLOSED", closedBy: "SYSTEM", closedAt: new Date() },
        });

        try {
          getIo()
            .to(`session:${session.id}`)
            .to("waiter")
            .to("kitchen")
            .emit("session:closed", {
              sessionId: session.id,
              tableId: session.tableId,
              closedAt: new Date().toISOString(),
            });
        } catch {
          // socket may not be initialized
        }

        logger.info(`[Scheduler] Auto-closed session ${session.id} for table ${session.tableId}`);
      }

      if (staleSessions.length > 0) {
        logger.info(`[Scheduler] Processed ${staleSessions.length} stale session(s)`);
      }
    } catch (error) {
      logger.error(`[Scheduler] Error in session auto-close: ${error}`);
    }
  });

  logger.info(`[Scheduler] Session auto-close started (timeout: ${SESSION_TIMEOUT_MINUTES} min, runs every 15 min)`);
}

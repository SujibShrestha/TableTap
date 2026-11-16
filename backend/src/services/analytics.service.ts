import { prisma } from "../config/db.js";
import logger from "../config/logger.js";
import { Prisma } from "../generated/prisma/index.js";
import { PAID_ORDER_STATUSES } from "../utils/analytics.js";

/**
 * All aggregation runs in Postgres: one grouped query instead of loading
 * every OrderItem row into memory (that table only ever grows).
 * Same rules the old JS version applied — parent order must be
 * CONFIRMED..SERVED and inside the requested date range.
 * `o` is the Order alias used by every query below.
 */
function paidOrderWhere(createdAt?: Prisma.DateTimeFilter<never>): Prisma.Sql {
  const conds = [Prisma.sql`o."status" IN (${Prisma.join([...PAID_ORDER_STATUSES])})`];
  if (createdAt?.gte) conds.push(Prisma.sql`o."createdAt" >= ${createdAt.gte}`);
  if (createdAt?.lte) conds.push(Prisma.sql`o."createdAt" <= ${createdAt.lte}`);
  return Prisma.join(conds, " AND ");
}

export const ordersummary = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
        const rows = await prisma.$queryRaw<
            { totalRevenue: unknown; totalProfit: unknown; totalOrders: unknown }[]
        >`
            SELECT
                COALESCE(SUM(oi."unitPrice" * oi.quantity), 0)::numeric AS "totalRevenue",
                COALESCE(SUM((oi."unitPrice" - oi."costPriceAtOrder") * oi.quantity), 0)::numeric AS "totalProfit",
                (SELECT COUNT(*) FROM "Order" o WHERE ${paidOrderWhere(createdAt)}) AS "totalOrders"
            FROM "OrderItem" oi
            JOIN "Order" o ON o."id" = oi."orderId"
            WHERE ${paidOrderWhere(createdAt)}
        `;

        const row = rows[0];
        return {
            totalRevenue: Number(row?.totalRevenue ?? 0),
            totalProfit: Number(row?.totalProfit ?? 0),
            totalOrders: Number(row?.totalOrders ?? 0),
        };
    } catch (error) {
        logger.error("Error fetching order summary:", error);
        throw error;
    }
}


export const bestSeller = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
        const rows = await prisma.$queryRaw<
            { name: string; quantitySold: unknown; revenue: unknown; sessionCount: unknown }[]
        >`
            SELECT
                m."name",
                SUM(oi.quantity) AS "quantitySold",
                COALESCE(SUM(oi."unitPrice" * oi.quantity), 0)::numeric AS "revenue",
                COUNT(DISTINCT o."sessionId") AS "sessionCount"
            FROM "OrderItem" oi
            JOIN "Order" o ON o."id" = oi."orderId"
            JOIN "MenuItem" m ON m."id" = oi."menuItemId"
            WHERE ${paidOrderWhere(createdAt)}
            GROUP BY oi."menuItemId", m."name"
            ORDER BY "sessionCount" DESC, "quantitySold" DESC
            LIMIT 10
        `;

        return rows.map((row) => ({
            name: row.name,
            quantitySold: Number(row.quantitySold),
            revenue: Number(row.revenue),
            sessionCount: Number(row.sessionCount),
        }));
    } catch (error) {
        logger.error("Error fetching best sellers:", error);
        throw error;
    }
}


export const dailyTrend = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
        const rows = await prisma.$queryRaw<
            { date: string; revenue: unknown; profit: unknown }[]
        >`
            SELECT
                oi."createdAt"::date::text AS "date",
                COALESCE(SUM(oi."unitPrice" * oi.quantity), 0)::numeric AS "revenue",
                COALESCE(SUM((oi."unitPrice" - oi."costPriceAtOrder") * oi.quantity), 0)::numeric AS "profit"
            FROM "OrderItem" oi
            JOIN "Order" o ON o."id" = oi."orderId"
            WHERE ${paidOrderWhere(createdAt)}
            GROUP BY 1
            ORDER BY 1
        `;

        return rows.map((row) => ({
            date: row.date,
            revenue: Number(row.revenue),
            profit: Number(row.profit),
        }));
    } catch (error) {
        logger.error("Error fetching daily trend:", error);
        throw error;
    }
};

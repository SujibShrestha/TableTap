import { prisma } from "../config/db.js";
import logger from "../config/logger.js";
import type { Prisma } from "../generated/prisma/index.js";
import { PAID_ORDER_STATUSES } from "../utils/analytics.js";

export const ordersummary = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
               order: {
                   status: { in: [...PAID_ORDER_STATUSES] },
                ...(createdAt && { createdAt }),
            }
        },
    }
    );





    const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    
    const totalProfit = orderItems.reduce((sum, item) => sum + (Number(item.unitPrice)- Number(item.costPriceAtOrder)) * item.quantity, 0);

    const totalOrders = await prisma.order.count({
        where: {
            status: { in: [...PAID_ORDER_STATUSES] },
            ...(createdAt && { createdAt }),
        }
    });
        return {
            totalRevenue,
            totalProfit,
            totalOrders,
        };
    } catch (error) {
        logger.error("Error fetching order summary:", error);
        throw error;
    }

}


export const bestSeller = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
       const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    status: { in: [...PAID_ORDER_STATUSES] },
                    ...(createdAt && { createdAt }),
                }
            },
            include: {
                menuItem: true,
                order: { select: { sessionId: true } },
            },
        });

        const grouped = new Map<string, { name: string; quantitySold: number; revenue: number; sessionIds: Set<string> }>();

        for (const item of orderItems) {
            const key = item.menuItemId;
            const existing = grouped.get(key) ?? { name: item.menuItem.name, quantitySold: 0, revenue: 0, sessionIds: new Set() };
            existing.quantitySold += item.quantity;
            existing.revenue += Number(item.unitPrice) * item.quantity;
            existing.sessionIds.add(item.order.sessionId);
            grouped.set(key, existing);
        }
        
        const bestSellers = Array.from(grouped.values())
            .map(({ sessionIds, ...rest }) => ({ ...rest, sessionCount: sessionIds.size }))
            .sort((a, b) => b.sessionCount - a.sessionCount || b.quantitySold - a.quantitySold)
            .slice(0, 10);
        return bestSellers;
    } catch (error) {
        logger.error("Error fetching best sellers:", error);
        throw error;
    }
} 


export const dailyTrend = async ({ createdAt }: { createdAt: Prisma.DateTimeFilter<never> | undefined; }) => {
    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    status: { in: [...PAID_ORDER_STATUSES] },
                    ...(createdAt && { createdAt }),
                }
            },
            select: {
                unitPrice: true,
                costPriceAtOrder: true,
                quantity: true,
                createdAt: true,
            },
        });

        const grouped = new Map<string, { revenue: number; profit: number }>();

        for (const item of orderItems) {
            const day = item.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
            const existing = grouped.get(day) ?? { revenue: 0, profit: 0 };
            existing.revenue += Number(item.unitPrice) * item.quantity;
            existing.profit += (Number(item.unitPrice) - Number(item.costPriceAtOrder)) * item.quantity;
            grouped.set(day, existing);
        }

        const daily = Array.from(grouped.entries())
            .map(([date, data]) => ({
                date,
                revenue: Number(data.revenue.toFixed(2)),
                profit: Number(data.profit.toFixed(2)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return daily;
    } catch (error) {
        logger.error("Error fetching daily trend:", error);
        throw error;
    }
};
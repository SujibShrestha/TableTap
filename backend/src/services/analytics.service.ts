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
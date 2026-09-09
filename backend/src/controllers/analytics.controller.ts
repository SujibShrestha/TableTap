import type { Request, Response } from "express";
import { dateRangeSchema } from "../validations/analytics.validation.js";
import { buildDateRangeFilter } from "../utils/analytics.js";
import { bestSeller, ordersummary } from "../services/analytics.service.js";
import logger from "../config/logger.js";

export const orderSummary = async (req: Request, res: Response) => {
    
    const parsed = dateRangeSchema.safeParse(req.query);
    
    if(!parsed.success) {
        return res.status(400).json({ error: "Invalid date range" });
    }

    const { from, to } = parsed.data;
    const createdAt = buildDateRangeFilter(from, to);

    const summary = await ordersummary({ createdAt });
    if(!summary) {
        return res.status(404).json({ error: "No data found for the given date range" });
    }
    logger.info(`Order summary fetched for date range: ${from} to ${to}`);  
    return res.status(200).json({
        message: "Order summary fetched successfully",
        data:{
            totalRevenue: Number(summary.totalRevenue.toFixed(2)),
            totalProfit: Number(summary.totalProfit.toFixed(2)),
            totalOrders: Number(summary.totalOrders),
        }
    });
}


export const bestSellers = async (req: Request, res: Response) => {
    const parsed = dateRangeSchema.safeParse(req.query);
    
    if(!parsed.success) {
        return res.status(400).json({ error: "Invalid date range" });
    }

    const { from, to } = parsed.data;
    const createdAt = buildDateRangeFilter(from, to);

    const bestSellersData = await bestSeller({ createdAt });

    if(!bestSellersData || bestSellersData.length === 0) {
        return res.status(404).json({ error: "No data found for the given date range" });
    }
    logger.info(`Best sellers fetched for date range: ${from} to ${to}`);  
    return res.status(200).json({
        message: "Best sellers fetched successfully",
        data: bestSellersData,
    });
}
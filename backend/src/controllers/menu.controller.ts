import type { Request, Response } from "express";
import { createMenuItemSchema } from "../validations/menu.validation.js";
import { createmenuItem, deletemenuItem, getmenuItems, getmenuItemsByCategoryId, updatemenuItem } from "../services/menu.service.js";
import logger from "../config/logger.js";

export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const parsed = createMenuItemSchema.parse(req.body);

        const menuItem = await createmenuItem({
            name: parsed.name,
            price: parsed.price,
            categoryId: parsed.categoryId,
            costPrice: parsed.costPrice,
            ...(parsed.description !== undefined ? { description: parsed.description } : {}),
            ...(parsed.imageUrl !== undefined ? { imageUrl: parsed.imageUrl } : {}),
            ...(parsed.isAvailable !== undefined ? { isAvailable: parsed.isAvailable } : {}),
        });


        if(!menuItem) {
            return res.status(400).json({ message: "Menu item creation failed" });
        }
        
        logger.info(`Menu item created successfully: ${menuItem.id}`);
        return res.status(201).json({message: "Menu item created successfully", menuItem});
    } catch (error) {
        logger.error(`Error creating menu item: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to create menu item",
        });
    }
};


export const getMenuItems = async (req: Request, res: Response) => {
    try {
        const menuItems = await getmenuItems();

        if(!menuItems) {
            return res.status(404).json({ message: "No menu items found" });
        }
        
        logger.info(`Fetched ${menuItems.length} menu items successfully`);
        return res.status(200).json({ message: "Menu items fetched successfully", menuItems });
    } catch (error) {
        logger.error(`Error fetching menu items: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to fetch menu items",
        });
    }
};

export const getMenuItemByCategoryId = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!id) {
            return res.status(400).json({ message: "Invalid input: id is required" });
        }

        const menuItem = await getmenuItemsByCategoryId(id);

        if(!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        logger.info(`Fetched menu items successfully:}`);
        return res.status(200).json({ message: "Menu item fetched successfully", menuItem });
    } catch (error) {
        logger.error(`Error fetching menu item: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to fetch menu item",
        });
    }
};


export const updateMenuItem = async (req: Request, res: Response) => {

    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { isAvailable } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Invalid input: id is required" });
        }

        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({ message: "Invalid input: isAvailable must be a boolean" });
        }

        const updatedMenuItem = await updatemenuItem({ id, isAvailable });

        if(!updatedMenuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        logger.info(`Menu item updated successfully: ${updatedMenuItem.id}`);
        return res.status(200).json({ message: "Menu item updated successfully", updatedMenuItem });
    } catch (error) {
        logger.error(`Error updating menu item: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to update menu item",
        });
    }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!id) {
            return res.status(400).json({ message: "Invalid input: id is required" });
        }

        const deletedMenuItem = await deletemenuItem(id);

        if(!deletedMenuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        logger.info(`Menu item deleted successfully: ${deletedMenuItem.id}`);
        return res.status(200).json({ message: "Menu item deleted successfully", deletedMenuItem });
    } catch (error) {
        logger.error(`Error deleting menu item: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to delete menu item",
        });
    }
};
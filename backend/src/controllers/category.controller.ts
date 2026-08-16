import type { Request, Response } from "express";
import { createCategorySchema } from "../validations/menu.validation.js";
import { createcategory, deleteCategoryById, getallCategories } from "../services/category.service.js";
import logger from "../config/logger.js";


export const createCategory = async (req:Request, res:Response) => {
    try {
        const parsed = createCategorySchema.parse(req.body);

        if (!parsed) {
            return res.status(400).json({ message: "Invalid request body" });
        }
        const { name } = parsed;

        const category = await createcategory(name);
        logger.info(`Category created successfully: ${category.name}`);
        return res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        logger.error(`Error creating category: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await getallCategories();
        if (!categories) {
            return res.status(404).json({ message: "No categories found" });
        }
        logger.info(`Fetched ${categories.length} categories successfully`);
        return res.status(200).json({ message: "Categories fetched successfully", categories });
    } catch (error) {
        logger.error(`Error fetching categories: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;

        if(!id){
            return res.status(400).json({ message: "Category ID is required" });
        }
        
        const category = await deleteCategoryById(id as string);
        if(!category){
            return res.status(404).json({ message: "Category not found" });
        }

        logger.info(`Category deleted successfully: ${category.name}`);
        return res.status(200).json({ message: "Category deleted successfully", category });
    }
    catch (error) {
        logger.error(`Error deleting category: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};  
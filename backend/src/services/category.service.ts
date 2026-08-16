import { prisma } from "../config/db.js"

export const createcategory = async(name: string) => {
    try {
        const category = await prisma.category.create({
            data: {
                name
            }
        });

        if(!category) {
            throw new Error("Failed to create category");
        }
        return category;
    } catch (error) {
        throw new Error(`Error creating category: ${error}`);
    }
};

export const getallCategories = async () => {
    try {
        const categories = await prisma.category.findMany();
        return categories;
    } catch (error) {
        throw new Error(`Error fetching categories: ${error}`);
    }

};

export const deleteCategoryById = async (id: string) => {
    try {
        const category = await prisma.category.delete({
            where: {
                id
            }
        });

        if(!category) {
            throw new Error("Failed to delete category");
        }
        return category;
    } catch (error) {
        throw new Error(`Error deleting category: ${error}`);
    }
};
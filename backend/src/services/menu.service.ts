import { prisma } from "../config/db.js";

export const createmenuItem = async ({
    name,
    description,
    price,
    categoryId,
    imageUrl,
    costPrice,
    isAvailable,
}: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
    costPrice: number;
    isAvailable?: boolean;
}) => {
    try {
        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                price,
                categoryId,
                costPrice,
                ...(description !== undefined ? { description } : {}),
                ...(imageUrl !== undefined ? { imageUrl } : {}),
                ...(isAvailable !== undefined ? { isAvailable } : {}),
            },
        });
        if(!menuItem) {
            throw new Error("Menu item creation failed");
        }
        return menuItem;
    } catch (error) {

        throw new Error(`Error creating menu item: ${error}`);
    }
};


export const getmenuItems = async () => {
    try {
        const menuItems = await prisma.menuItem.findMany();
        if(!menuItems) {
            throw new Error("No menu items found");
        }
        return menuItems;
    } catch (error) {
        throw new Error(`Error fetching menu items: ${error}`);
    }   
};
export const getmenuItemsByCategoryId = async (categoryId: string) => {
    try {
        const menuItems = await prisma.menuItem.findMany({
            where: { categoryId },
        });
        if(!menuItems) {
            throw new Error("No menu items found for the given category");
        }
        return menuItems;
    } catch (error) {
        throw new Error(`Error fetching menu items by category id: ${error}`);
    }
};

export const updatemenuItem = async ({
    id,
    isAvailable,
}: {
    id: string;
    isAvailable: boolean;
}) => {
    try {
        const menuItem = await prisma.menuItem.update({
            where: { id },
            data: { isAvailable },
        });
        if(!menuItem) {
            throw new Error("Menu item update failed");
        }
        return menuItem;
    } catch (error) {
        throw new Error(`Error updating menu item: ${error}`);
    }
};

export const deletemenuItem = async (id: string) => {
    try {
        const menuItem = await prisma.menuItem.delete({
            where: { id },
        });
        if(!menuItem) {
            throw new Error("Menu item deletion failed");
        }
        return menuItem;
    } catch (error) {
        throw new Error(`Error deleting menu item: ${error}`);
    }
};
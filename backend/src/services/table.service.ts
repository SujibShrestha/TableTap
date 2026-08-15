import { prisma } from "../config/db.js";
import logger from "../config/logger.js";

export const createtable = async (tableNumber: string) => {
 try {
    
  const table = await prisma.restaurantTable.create({
    data: { tableNumber },
  });

  const tableUrl = `${process.env.FRONTEND_URL}/t/${table.id}`;

  if(!tableUrl) {
    throw new Error("Failed to generate table URL");
  }
  logger.info(`Table created with ID: ${table.id} and URL: ${tableUrl}`);
  return { table, tableUrl };

 } catch (error) {
    logger.error(`Error creating table: ${error}`);
    throw error;
    
 }
};


export const getAllTables = async () => {
  try {
    const tables = await prisma.restaurantTable.findMany();

    if(!tables) {
      throw new Error("No tables found in the database");
    }
    logger.info(`Retrieved ${tables.length} tables from the database`);
    return tables;
  }
    catch (error) {
    logger.error(`Error retrieving tables: ${error}`);
    throw error;
  }
};

export const updatetable = async (id: string, data: { tableNumber?: string; isActive?: boolean }) => {
    try {   
        const table = await prisma.restaurantTable.update({
            where: { id },
            data,
        });

        if(!table) {
            throw new Error(`Table with ID ${id} not found`);
        }
        logger.info(`Table with ID ${id} updated successfully`);
        return table;
    } catch (error) {
        logger.error(`Error updating table with ID ${id}: ${error}`);
        throw error;
    }
}

export const deleteTableById = async (id: string) => {
    try {
        const table = await prisma.restaurantTable.delete({
            where: { id },
        });

        if(!table) {
            throw new Error(`Table with ID ${id} not found`);
        }
        logger.info(`Table with ID ${id} deleted successfully`);
        return table;
    } catch (error) {
        logger.error(`Error deleting table with ID ${id}: ${error}`);
        throw error;
    }
}
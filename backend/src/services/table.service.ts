import { prisma } from "../config/db.js";
import logger from "../config/logger.js";

export const createtable = async (tableNumber: string) => {
 try {

  const existingTable = await prisma.restaurantTable.findUnique({ where: { tableNumber } });
  if (existingTable) {
    throw new Error("Table with this number already exists");
  }

  const table = await prisma.restaurantTable.create({
    data: { tableNumber },
  });

  const tableUrl = `${process.env.FRONTEND_URL}/t/${table.id}`;

  if(!tableUrl) {
    throw new Error("Failed to generate table URL");
  }

  const tableWithQr = await prisma.restaurantTable.update({
    where: { id: table.id },
    data: { qrCodeUrl: tableUrl },
  });

  logger.info(`Table created with ID: ${table.id} and URL: ${tableUrl}`);
  return { table: tableWithQr, tableUrl };

 } catch (error) {
    logger.error(`Error creating table: ${error}`);
    throw error;
    
 }
};


export const getAllTables = async () => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: { tableNumber: 'asc' },
    });

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

export const getTableById = async (id: string) => {
    const table = await prisma.restaurantTable.findUnique({ where: { id } });

    if (!table) {
        throw new Error("Table not found");
    }

    return table;
};

export const updatetable = async (id: string, data: { tableNumber?: string; isActive?: boolean }) => {
    try {
        const existingTable = await prisma.restaurantTable.findUnique({ where: { id } });

        if (!existingTable) {
            throw new Error("Table not found");
        }

        if (data.tableNumber !== undefined && data.tableNumber !== existingTable.tableNumber) {
            const numberTaken = await prisma.restaurantTable.findUnique({ where: { tableNumber: data.tableNumber } });

            if (numberTaken) {
                throw new Error("Table with this number already exists");
            }
        }

        const table = await prisma.restaurantTable.update({
            where: { id },
            data,
        });

        logger.info(`Table with ID ${id} updated successfully`);
        return table;
    } catch (error) {
        logger.error(`Error updating table with ID ${id}: ${error}`);
        throw error;
    }
}

export const deleteTableById = async (id: string) => {
    try {
        const existingTable = await prisma.restaurantTable.findUnique({ where: { id } });

        if (!existingTable) {
            throw new Error("Table not found");
        }

        const table = await prisma.restaurantTable.delete({
            where: { id },
        });

        logger.info(`Table with ID ${id} deleted successfully`);
        return table;
    } catch (error) {
        logger.error(`Error deleting table with ID ${id}: ${error}`);
        throw error;
    }
}
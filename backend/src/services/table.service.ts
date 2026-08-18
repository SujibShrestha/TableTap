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

export const tableStatus = async (id: string) => {
    try {
        const table = await prisma.restaurantTable.findUnique({ where: { id } });

        if (!table || !table.isActive) {
            throw new Error("Table not found");
        }

        let session = await prisma.tableSession.findFirst({
            where:{
                tableId: table.id,
                status: "ACTIVE"
            }
        })

        if(!session) {
            session = await prisma.tableSession.create({
                data: {
                    tableId: table.id,
                    status: "ACTIVE"
                }
            })
        }

        return {
            table:{id: table.id, tableNumber: table.tableNumber},
            session: {id: session.id, status: session.status}
        }

    } catch (error) {
        logger.error(`Error retrieving status for table with ID ${id}: ${error}`);
        throw error;
    }
}

export const closeTableSession = async (id: string, closedBy: "SYSTEM" | "STAFF" = "STAFF") => {
    try {
        const table = await prisma.restaurantTable.findUnique({ where: { id } });

        if (!table) {
            throw new Error("Table not found");
        }

        const session = await prisma.tableSession.findFirst({
            where: {
                tableId: table.id,
                status: "ACTIVE"
            }
        });

        if (!session) {
            throw new Error("No active session for this table");
        }

        const closedSession = await prisma.tableSession.update({
            where: { id: session.id },
            data: {
                status: "CLOSED",
                closedBy,
                closedAt: new Date()
            }
        });

        logger.info(`Session ${closedSession.id} closed for table ${id}`);
        return closedSession;
    } catch (error) {
        logger.error(`Error closing session for table with ID ${id}: ${error}`);
        throw error;
    }
}
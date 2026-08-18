import type { Request, Response } from "express";
import { createTableSchema, updateTableSchema } from "../validations/table.validation.js";
import { closeTableSession as closeTableSessionService, createtable, deleteTableById, getAllTables, getTableById as getTableByIdService, tableStatus, updatetable } from "../services/table.service.js";
import logger from "../config/logger.js";

export const createTable = async (req: Request, res: Response) => {
  try {
    const parsed = createTableSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { tableNumber } = parsed.data;
    const table = await createtable(tableNumber);

    if (!table) {
      logger.error(`Failed to create table with number: ${tableNumber}`);
      return res.status(500).json({ error: "Failed to create table" });
    }

    logger.info(`Table created successfully with number: ${tableNumber}`);
    return res.status(201).json({ message: "Table created successfully", table });
  } catch (error) {
    logger.error(`Error in createTable controller: ${error}`);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message === "Table with this number already exists" ? 409 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getTables = async (req: Request, res: Response) => {
  try {
    const table = await getAllTables();

    if (!table) {
      logger.error("No tables found in the database");
      return res.status(404).json({ error: "No tables found" });
    }

    logger.info(`Retrieved ${table.length} tables successfully`);
    return res.status(200).json({ message: "Tables retrieved successfully", table });
  } catch (error) {
    logger.error(`Error in getTables controller: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const tableId = typeof req.params.id === "string" ? req.params.id : undefined;

    if (!tableId) {
      return res.status(400).json({ error: "Table id is required" });
    }

    const table = await getTableByIdService(tableId);

    logger.info(`Retrieved table with ID: ${tableId} successfully`);
    return res.status(200).json({ message: "Table retrieved successfully", table });
  } catch (error) {
    logger.error(`Error in getTableById controller: ${error}`);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message === "Table not found" ? 404 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const parsed = updateTableSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const tableId = typeof req.params.id === "string" ? req.params.id : undefined;

    if (!tableId) {
      return res.status(400).json({ error: "Table id is required" });
    }

    const updateData: { tableNumber?: string; isActive?: boolean } = {};

    if (parsed.data.tableNumber !== undefined) {
      updateData.tableNumber = parsed.data.tableNumber;
    }

    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }

    const table = await updatetable(tableId, updateData);

    if (!table) {
      logger.error(`Failed to update table with ID: ${tableId}`);
      return res.status(404).json({ error: "Table not found" });
    }

    logger.info(`Table updated successfully with ID: ${tableId}`);
    return res.status(200).json({ message: "Table updated successfully", table });
  } catch (error) {
    logger.error(`Error in updateTable controller: ${error}`);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode =
      message === "Table with this number already exists" ? 409 : message === "Table not found" ? 404 : 500;
    return res.status(statusCode).json({ error: message });
  }
};


export const deleteTable = async (req: Request, res: Response) => {
    try {
        const tableId = typeof req.params.id === "string" ? req.params.id : undefined;

        if (!tableId) {
            return res.status(400).json({ error: "Table id is required" });
        }

        const table = await deleteTableById(tableId);

        if (!table) {
            logger.error(`Failed to delete table with ID: ${tableId}`);
            return res.status(404).json({ error: "Table not found" });
        }

        logger.info(`Table deleted successfully with ID: ${tableId}`);
        return res.status(200).json({ message: "Table deleted successfully", table });
    } catch (error) {
        logger.error(`Error in deleteTable controller: ${error}`);
        const message = error instanceof Error ? error.message : "Internal server error";
        const statusCode = message === "Table not found" ? 404 : 500;
        return res.status(statusCode).json({ error: message });
    }
};

export const checkTableStatus = async(req: Request, res: Response) => {
    try {
        const tableId = typeof req.params.id === "string" ? req.params.id : undefined;

        if (!tableId) {
            return res.status(400).json({ error: "Table id is required" });
        }

        const table = await tableStatus(tableId);

        if (!table) {
            logger.error(`Failed to retrieve status for table with ID: ${tableId}`);
            return res.status(404).json({ error: "Table not found" });
        }

        logger.info(`Retrieved status for table with ID: ${tableId} successfully`);
        return res.status(200).json({ message: "Table status retrieved successfully", table });
    } catch (error) {
        logger.error(`Error in checkTableStatus controller: ${error}`);
        const message = error instanceof Error ? error.message : "Internal server error";
        const statusCode = message === "Table not found" ? 404 : 500;
        return res.status(statusCode).json({ error: message });
    }
};

export const closeTableSession = async (req: Request, res: Response) => {
    try {
        const tableId = typeof req.params.id === "string" ? req.params.id : undefined;

        if (!tableId) {
            return res.status(400).json({ error: "Table id is required" });
        }

        const closedBy = req.body?.closedBy === "SYSTEM" ? "SYSTEM" : "STAFF";

        const session = await closeTableSessionService(tableId, closedBy);

        logger.info(`Closed session for table with ID: ${tableId} successfully`);
        return res.status(200).json({ message: "Table session closed successfully", session });
    } catch (error) {
        logger.error(`Error in closeTableSession controller: ${error}`);
        const message = error instanceof Error ? error.message : "Internal server error";
        const statusCode =
            message === "Table not found" || message === "No active session for this table" ? 404 : 500;
        return res.status(statusCode).json({ error: message });
    }
};
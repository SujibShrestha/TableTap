import type { Request, Response } from "express";
import { createStaffSchema } from "../validations/user.validation.js";
import { createuser } from "../services/user.service.js";

export const createUser = async (req: Request, res: Response) => {
    try {
        const parsed = createStaffSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }

        const { name, email, password, role, phone } = parsed.data;

        const user = await createuser({
            name,
            email,
            password,
            role,
            phone,
        });

        if(!user) {
            return res.status(500).json({
                success: false,
                message: "Failed to create user",
            });
        }

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create user";

        return res.status(500).json({
            success: false,
            message,
        });
    }
};
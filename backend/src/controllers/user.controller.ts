import type { Request, Response } from "express";
import {
    changeOwnPasswordSchema,
    createStaffSchema,
    updatePasswordSchema,
    updateUserSchema,
} from "../validations/user.validation.js";
import {
    changeOwnPassword,
    createuser,
    deleteUserById,
    getUserById,
    getUserProfile,
    listUsers,
    resetUserPassword,
    updateUserById,
} from "../services/user.service.js";

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

        if (!user) {
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
        const statusCode = message === "User with this email already exists" ? 409 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const role = typeof req.query.role === "string" ? req.query.role : undefined;
        const isActive =
            req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;

        const data = await listUsers({ page, limit, role, isActive });

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch users";

        return res.status(500).json({
            success: false,
            message,
        });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await getUserById(req.params.id as string);

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch user";
        const statusCode = message === "User not found" ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;

        const user = await getUserProfile(userId);

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch profile";

        return res.status(500).json({
            success: false,
            message,
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const parsed = updateUserSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }

        const user = await updateUserById(req.params.id as string, parsed.data);

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        const statusCode =
            message === "User not found"
                ? 404
                : message === "User with this email already exists"
                  ? 409
                  : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const parsed = updatePasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }

        await resetUserPassword(req.params.id as string, parsed.data.newPassword);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reset password";
        const statusCode = message === "User not found" ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const changeMyPassword = async (req: Request, res: Response) => {
    try {
        const parsed = changeOwnPasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }

        const userId = (req as any).user?.sub;

        await changeOwnPassword(userId, parsed.data.oldPassword, parsed.data.newPassword);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to change password";
        const statusCode = message === "Current password is incorrect" ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await deleteUserById(req.params.id as string);

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to deactivate user";
        const statusCode =
            message === "User not found"
                ? 404
                : message === "User is already deactivated"
                  ? 400
                  : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};
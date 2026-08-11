import type { Request, Response } from "express";
import { login, logoutSession, refreshSession } from "../services/auth.service.js";
import { loginSchema, refreshSchema } from "../validations/auth.validation.js";


export const loginController= async(req:Request, res:Response)=> {
    try {

        const { email, password } = loginSchema.parse(req.body);

        if(!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await login({email, password});
        
        if(!user){
            return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: user,
        });
        
    } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        const statusCode = message === "Invalid email or password" ? 401 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

export const refreshController = async (req: Request, res: Response) => {
    try {
        const parsed = refreshSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const session = await refreshSession(parsed.data.refreshToken);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: session,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Refresh failed";
        const statusCode = message === "Invalid or expired refresh token" || message === "Refresh token is required" ? 401 : 500;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};


export const logoutController = async (req: Request, res: Response) => {
    try {
        const parsed = refreshSchema.safeParse(req.body);   

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        await logoutSession(parsed.data.refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Logout failed";

        return res.status(500).json({
            success: false,
            message,
        });
    }
};
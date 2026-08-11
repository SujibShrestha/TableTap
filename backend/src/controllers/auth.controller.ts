import type { Request, Response } from "express";
import { login } from "../services/auth.service.js";


export async function loginController(req:Request, res:Response) {
    try {

        const { email, password } = req.body;

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
}
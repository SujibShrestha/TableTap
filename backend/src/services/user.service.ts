import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER';
  phone?: string | null;
}
export const createuser = async (userData: CreateUserInput) => {
    const { name, email, password, role, phone } = userData;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role,
            phone: phone || null,
        },
    });

    const { passwordHash: _, ...safeUser } = newUser; // Exclude passwordHash from the returned user object

    return safeUser;
};

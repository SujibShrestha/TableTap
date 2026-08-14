import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import type { Prisma, Role } from "../generated/prisma/index.js";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER';
  phone?: string | null;
}

export interface ListUsersInput {
  page: number;
  limit: number;
  role?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateUserInput {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
  role?: Role | undefined;
  isActive?: boolean | undefined;
}

export const listUsers = async ({ page, limit, role, isActive }: ListUsersInput) => {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as Role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    const safeUsers = users.map(({ passwordHash, ...safeUser }) => safeUser);

    return {
        users: safeUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw new Error('User not found');
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
};

export const getUserProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error('User not found');
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
};

export const updateUserById = async (id: string, data: UpdateUserInput) => {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
        throw new Error('User not found');
    }

    if (data.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });

        if (emailTaken && emailTaken.id !== id) {
            throw new Error('User with this email already exists');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.role !== undefined && { role: data.role }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return safeUser;
};

export const resetUserPassword = async (id: string, newPassword: string) => {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
        throw new Error('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id },
        data: { passwordHash },
    });
};

export const changeOwnPassword = async (userId: string, oldPassword: string, newPassword: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new Error('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
};

export const deleteUserById = async (id: string) => {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
        throw new Error('User not found');
    }

    if (!existingUser.isActive) {
        throw new Error('User is already deactivated');
    }

    await prisma.user.update({
        where: { id },
        data: { isActive: false },
    });
};
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

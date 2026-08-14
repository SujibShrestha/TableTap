export type Role = "ADMIN" | "WAITER" | "KITCHEN" | "CASHIER";

export const ROLES: Role[] = ["ADMIN", "WAITER", "KITCHEN", "CASHIER"];

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: Role | "";
  isActive?: boolean | "";
}

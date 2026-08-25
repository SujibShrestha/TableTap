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

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  qrCodeUrl: string | null;
  isActive: boolean;
  isOccupied?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTablePayload {
  tableNumber: string;
}

export interface UpdateTablePayload {
  tableNumber?: string;
  isActive?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  costPrice: string;
  categoryId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  costPrice: number;
  isAvailable?: boolean;
  categoryId: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: string;
  costPriceAtOrder: string;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  sessionId: string;
  status: string;
  specialInstructions: string | null;
  totalAmount: string;
  updatedByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  session?: {
    id: string;
    tableId: string;
    table?: RestaurantTable;
  };
}

export interface CreateOrderPayload {
  sessionId?: string;
  tableId?: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
}

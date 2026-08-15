import axios from "axios";
import type {
  AuthSession,
  CreateTablePayload,
  ListUsersParams,
  PaginatedUsers,
  RestaurantTable,
  Role,
  UpdateTablePayload,
  User,
} from "@/types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginPayload): Promise<AuthSession> => {
  const res = await api.post("/auth/login", data);
  return res.data.data;
};

export const refreshSession = async (refreshToken: string): Promise<AuthSession> => {
  const res = await api.post("/auth/refresh", { refreshToken });
  return res.data.data;
};

export const logoutUser = async (refreshToken: string) => {
  const res = await api.post("/auth/logout", { refreshToken });
  return res.data.data;
};

// ---------------- Users ----------------

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: Role;
  isActive?: boolean;
}

export interface ResetPasswordPayload {
  newPassword: string;
}

export interface ChangeOwnPasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const getUsers = async (token: string, params: ListUsersParams) => {
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;
  if (params.role) cleanParams.role = params.role;
  if (params.isActive !== "" && params.isActive !== undefined) {
    cleanParams.isActive = params.isActive;
  }

  const res = await api.get("/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: cleanParams,
  });

  return res.data.data as PaginatedUsers;
};

export const getMe = async (token: string): Promise<User> => {
  const res = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const getUser = async (token: string, id: string): Promise<User> => {
  const res = await api.get(`/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const createUser = async (token: string, data: CreateUserPayload) => {
  const res = await api.post("/users", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const updateUser = async (token: string, id: string, data: UpdateUserPayload) => {
  const res = await api.patch(`/users/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const resetUserPassword = async (token: string, id: string, data: ResetPasswordPayload) => {
  const res = await api.patch(`/users/${id}/password`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const deactivateUser = async (token: string, id: string) => {
  const res = await api.delete(`/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

export const changeOwnPassword = async (token: string, data: ChangeOwnPasswordPayload) => {
  const res = await api.patch("/users/me/password", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

// ---------------- Tables ----------------

export const getTables = async (token: string) => {
  const res = await api.get("/tables", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.table as RestaurantTable[];
};

export const createTable = async (token: string, data: CreateTablePayload) => {
  const res = await api.post("/tables", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.table as RestaurantTable;
};

export const updateTable = async (token: string, id: string, data: UpdateTablePayload) => {
  const res = await api.put(`/tables/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.table as RestaurantTable;
};

export const deleteTable = async (token: string, id: string) => {
  const res = await api.delete(`/tables/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.table as RestaurantTable;
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

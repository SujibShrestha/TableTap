import type { AuthSession } from "@/types";

const STORAGE_KEY = "tabletap.auth";

type Listener = () => void;

const listeners = new Set<Listener>();

export function getAuth(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setAuth(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit();
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

import type { UserRole } from "./auth.js";

export interface UserRecord {
  id: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  createdAt: string;
  disabledAt: string | null;
  tokenCount: number;
  imageCount: number;
}

export interface ListUsersResponse {
  items: UserRecord[];
}

export interface DisableUserResponse {
  id: string;
  disabledAt: string;
  ok: true;
}

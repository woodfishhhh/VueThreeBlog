export type UserRole = "admin" | "member";
export interface LoginRequest {
    identifier: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    tokenId: string;
    role: UserRole;
    expiresAt: string | null;
}
export interface MeResponse {
    id: string;
    email: string | null;
    displayName: string;
    role: UserRole;
    createdAt: string;
    disabledAt: string | null;
}
//# sourceMappingURL=auth.d.ts.map
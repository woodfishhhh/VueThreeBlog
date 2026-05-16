export type TokenScope = "upload" | "images:read" | "images:delete" | "tokens:manage" | "invites:manage" | "admin";
export interface TokenRecord {
    id: string;
    name: string;
    scopes: TokenScope[];
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
}
export interface CreateTokenRequest {
    name: string;
    scopes: TokenScope[];
    expiresAt?: string | null;
}
export interface CreateTokenResponse {
    token: string;
    record: TokenRecord;
}
export interface ListTokensResponse {
    items: TokenRecord[];
}
//# sourceMappingURL=tokens.d.ts.map
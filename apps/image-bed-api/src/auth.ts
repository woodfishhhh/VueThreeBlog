import crypto from "node:crypto";

import type Database from "better-sqlite3";

export interface AuthUser {
  id: string;
  role: "admin" | "member";
  displayName: string;
}

export interface AuthContext {
  tokenId: string;
  user: AuthUser;
  scopes: string[];
}

export function hashToken(rawToken: string, tokenSecret: string) {
  return crypto.createHash("sha256").update(`${tokenSecret}:${rawToken}`).digest("hex");
}

export function hashInviteCode(rawInviteCode: string, tokenSecret: string) {
  return crypto.createHash("sha256").update(`invite:${tokenSecret}:${rawInviteCode}`).digest("hex");
}

export function resolveAuthContext(
  db: Database.Database,
  tokenSecret: string,
  authorizationHeader: string | undefined,
): AuthContext | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const rawToken = authorizationHeader.slice("Bearer ".length).trim();
  if (rawToken.length === 0) {
    return null;
  }

  const tokenHash = hashToken(rawToken, tokenSecret);
  const row = db
    .prepare(
      `
        SELECT
          t.id AS token_id,
          t.user_id AS user_id,
          t.scopes AS scopes,
          t.expires_at AS expires_at,
          t.revoked_at AS revoked_at,
          u.display_name AS display_name,
          u.role AS role,
          u.disabled_at AS disabled_at
        FROM tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = ?
        LIMIT 1
      `,
    )
    .get(tokenHash) as
    | {
        token_id: string;
        user_id: string;
        scopes: string;
        expires_at: string | null;
        revoked_at: string | null;
        display_name: string;
        role: "admin" | "member";
        disabled_at: string | null;
      }
    | undefined;

  if (!row) {
    return null;
  }
  if (row.revoked_at || row.disabled_at) {
    return null;
  }
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    return null;
  }

  db.prepare("UPDATE tokens SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), row.token_id);

  const scopes = parseScopes(row.scopes);
  return {
    tokenId: row.token_id,
    user: {
      id: row.user_id,
      role: row.role,
      displayName: row.display_name,
    },
    scopes,
  };
}

export function ensureScope(context: AuthContext, scope: string) {
  return context.user.role === "admin" || context.scopes.includes(scope) || context.scopes.includes("admin");
}

export function parseScopes(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export interface MuyuConfig {
  endpoint?: string;
  token?: string;
}

export function resolveConfigPath() {
  const override = process.env.MUYU_UPLOAD_CONFIG;
  if (override && override.trim().length > 0) {
    return path.resolve(override.trim());
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(homedir(), "AppData", "Roaming");
    return path.join(appData, "WoodFishNest", "muyu-upload", "config.json");
  }

  return path.join(homedir(), ".config", "woodfish-nest", "muyu-upload", "config.json");
}

export async function readConfig(configPath = resolveConfigPath()): Promise<MuyuConfig> {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as MuyuConfig;
    return {
      endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : undefined,
      token: typeof parsed.token === "string" ? parsed.token : undefined,
    };
  } catch {
    return {};
  }
}

export async function writeConfig(input: MuyuConfig, configPath = resolveConfigPath()) {
  await mkdir(path.dirname(configPath), { recursive: true });
  const current = await readConfig(configPath);
  const next: MuyuConfig = {
    endpoint: input.endpoint ?? current.endpoint,
    token: input.token ?? current.token,
  };
  await writeFile(configPath, JSON.stringify(next, null, 2) + "\n", "utf8");
  return next;
}

export function redactToken(token: string | undefined) {
  if (!token || token.length < 10) {
    return token ?? "";
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function validateEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

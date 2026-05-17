declare const __APP_BASE_URL__: string;

const resolved: string =
  typeof __APP_BASE_URL__ !== "undefined" && __APP_BASE_URL__
    ? __APP_BASE_URL__
    : "/";

export function getBaseUrl(): string {
  return resolved;
}

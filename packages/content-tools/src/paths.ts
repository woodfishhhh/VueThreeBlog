import path from "node:path";
import { fileURLToPath } from "node:url";

export interface BlogPathOverrides {
  appRoot?: string;
  contentRoot?: string;
  generatedRoot?: string;
  publicRoot?: string;
  repoRoot?: string;
}

export interface ResolvedBlogPaths {
  appRoot: string;
  contentRoot: string;
  generatedRoot: string;
  publicRoot: string;
  repoRoot: string;
}

export function resolveDefaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function resolveBlogPaths(overrides: BlogPathOverrides = {}): ResolvedBlogPaths {
  const repoRoot = path.resolve(overrides.repoRoot ?? resolveDefaultRepoRoot());
  const appRoot = path.resolve(repoRoot, overrides.appRoot ?? "apps/blog");

  return {
    repoRoot,
    appRoot,
    contentRoot: path.resolve(appRoot, overrides.contentRoot ?? "content"),
    generatedRoot: path.resolve(appRoot, overrides.generatedRoot ?? "src/generated"),
    publicRoot: path.resolve(appRoot, overrides.publicRoot ?? "public"),
  };
}

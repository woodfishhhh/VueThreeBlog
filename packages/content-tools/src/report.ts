import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type UrlClass = "local-path" | "legacy-woodfish" | "muyu" | "external";

export interface UrlFinding {
  file: string;
  line: number;
  url: string;
  kind: UrlClass;
  host: string | null;
}

const LEGACY_HOSTS = new Set(["woodfishhhh.xyz", "www.woodfishhhh.xyz"]);

export async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(full)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(full);
    }
  }

  return results;
}

export async function scanImageUrls(contentRoot: string): Promise<UrlFinding[]> {
  const files = await collectMarkdownFiles(contentRoot);
  const findings: UrlFinding[] = [];
  const markdownImagePattern = /!\[[^\]]*]\(([^)]+)\)/g;
  const htmlImagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const pattern of [markdownImagePattern, htmlImagePattern]) {
        pattern.lastIndex = 0;
        let match = pattern.exec(line);
        while (match) {
          const url = match[1]?.trim();
          if (url) {
            findings.push({
              file,
              line: index + 1,
              url,
              ...classifyUrl(url),
            });
          }
          match = pattern.exec(line);
        }
      }
    });
  }

  return findings;
}

export function classifyUrl(input: string): { kind: UrlClass; host: string | null } {
  if (!/^https?:\/\//i.test(input)) {
    return {
      kind: "local-path",
      host: null,
    };
  }

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (host === "img.woodfish.site") {
      return { kind: "muyu", host };
    }
    if (LEGACY_HOSTS.has(host)) {
      return { kind: "legacy-woodfish", host };
    }
    return { kind: "external", host };
  } catch {
    return { kind: "external", host: null };
  }
}

export function summarizeFindings(findings: UrlFinding[]) {
  const summary = {
    total: findings.length,
    localPath: 0,
    legacyWoodfish: 0,
    muyu: 0,
    external: 0,
  };

  for (const item of findings) {
    if (item.kind === "local-path") {
      summary.localPath += 1;
    } else if (item.kind === "legacy-woodfish") {
      summary.legacyWoodfish += 1;
    } else if (item.kind === "muyu") {
      summary.muyu += 1;
    } else if (item.kind === "external") {
      summary.external += 1;
    }
  }

  return summary;
}

export function toMarkdownReport(findings: UrlFinding[]) {
  const summary = summarizeFindings(findings);
  const lines = [
    "# Image URL Report",
    "",
    `- Total: ${summary.total}`,
    `- Local path: ${summary.localPath}`,
    `- Legacy woodfishhhh: ${summary.legacyWoodfish}`,
    `- Muyu img.woodfish.site: ${summary.muyu}`,
    `- External hosts: ${summary.external}`,
    "",
    "| kind | host | file | line | url |",
    "| --- | --- | --- | ---: | --- |",
  ];

  for (const item of findings) {
    lines.push(`| ${item.kind} | ${item.host || "-"} | ${item.file} | ${item.line} | ${item.url} |`);
  }
  return lines.join("\n");
}

export function toCsvReport(findings: UrlFinding[]) {
  const header = "kind,host,file,line,url";
  const rows = findings.map((item) =>
    [item.kind, item.host || "", item.file, String(item.line), item.url].map(escapeCsv).join(","),
  );
  return [header, ...rows].join("\n");
}

function escapeCsv(value: string) {
  if (/[\",\n]/.test(value)) {
    return `"${value.replace(/\"/g, "\"\"")}"`;
  }
  return value;
}

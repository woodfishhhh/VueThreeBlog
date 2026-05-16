#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type { MeResponse, UploadImageResponse } from "@woodfish-nest/shared";

import { readConfig, redactToken, resolveConfigPath, validateEndpoint, writeConfig } from "./config.js";

type OutputFormat = "url" | "markdown" | "json";

interface UploadOptions {
  quiet: boolean;
  format: OutputFormat;
  files: string[];
}

export async function runCli(argv: string[]) {
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  if (command === "config") {
    return runConfig(rest);
  }

  if (command === "doctor") {
    return runDoctor();
  }

  if (command === "upload") {
    return runUpload(parseUploadArgs(rest));
  }

  return runUpload(parseUploadArgs([command, ...rest]));
}

async function runConfig(args: string[]) {
  const [sub, ...rest] = args;
  if (!sub || sub === "show") {
    const cfg = await readConfig();
    console.log(
      JSON.stringify(
        {
          configPath: resolveConfigPath(),
          endpoint: cfg.endpoint ?? null,
          token: redactToken(cfg.token),
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (sub !== "set" || rest.length < 2) {
    console.error("usage: muyu-upload config set <endpoint|token> <value>");
    return 2;
  }

  const [key, ...valueParts] = rest;
  const value = valueParts.join(" ").trim();
  if (!value) {
    console.error("config value cannot be empty");
    return 2;
  }

  if (key === "endpoint") {
    if (!validateEndpoint(value)) {
      console.error("endpoint must be a valid http(s) URL");
      return 2;
    }
    await writeConfig({ endpoint: value.replace(/\/+$/g, "") });
    return 0;
  }

  if (key === "token") {
    await writeConfig({ token: value });
    return 0;
  }

  console.error("config key must be endpoint or token");
  return 2;
}

async function runDoctor() {
  const configPath = resolveConfigPath();
  const cfg = await readConfig(configPath);
  let failed = false;

  console.log(`config: ${configPath}`);
  if (!cfg.endpoint) {
    console.log("endpoint: missing");
    failed = true;
  } else {
    console.log(`endpoint: ${cfg.endpoint}`);
  }

  if (!cfg.token) {
    console.log("token: missing");
    failed = true;
  } else {
    console.log(`token: ${redactToken(cfg.token)}`);
  }

  if (!cfg.endpoint) {
    return failed ? 1 : 0;
  }

  try {
    const health = await fetch(`${cfg.endpoint}/api/health`);
    console.log(`health: ${health.status}`);
    if (!health.ok) {
      failed = true;
    }
  } catch (error) {
    console.log(`health: failed (${formatError(error)})`);
    failed = true;
  }

  if (cfg.token) {
    try {
      const meResp = await fetch(`${cfg.endpoint}/api/me`, {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
        },
      });
      if (!meResp.ok) {
        console.log(`token: failed (${meResp.status})`);
        failed = true;
      } else {
        const me = (await meResp.json()) as MeResponse;
        console.log(`token: ok (${me.role}:${me.displayName})`);
      }
    } catch (error) {
      console.log(`token: failed (${formatError(error)})`);
      failed = true;
    }
  }

  return failed ? 1 : 0;
}

async function runUpload(options: UploadOptions) {
  if (options.files.length === 0) {
    console.error("usage: muyu-upload upload <file...> [--format url|markdown|json] [--quiet]");
    return 2;
  }

  const cfg = await readConfig();
  if (!cfg.endpoint || !validateEndpoint(cfg.endpoint)) {
    console.error("missing valid endpoint. set with: muyu-upload config set endpoint <url>");
    return 2;
  }
  if (!cfg.token) {
    console.error("missing token. set with: muyu-upload config set token <token>");
    return 2;
  }

  let hasError = false;
  for (const rawPath of options.files) {
    const finalPath = path.resolve(rawPath);
    try {
      const fileStat = await stat(finalPath);
      if (!fileStat.isFile()) {
        throw new Error("not a file");
      }
    } catch (error) {
      hasError = true;
      if (!options.quiet) {
        console.error(`skip: ${rawPath} (${formatError(error)})`);
      }
      continue;
    }

    const content = await readFile(finalPath);
    const form = new FormData();
    const fileName = path.basename(finalPath);
    form.set("file", new File([content], fileName));
    form.set("source", "cli");

    try {
      const resp = await fetch(`${cfg.endpoint}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
        },
        body: form,
      });

      if (!resp.ok) {
        hasError = true;
        const body = (await readJson(resp)) as { error?: { message?: string } } | null;
        const message = body?.error?.message || `HTTP ${resp.status}`;
        if (!options.quiet) {
          console.error(`upload failed: ${rawPath}: ${message}`);
        }
        continue;
      }

      const payload = (await resp.json()) as UploadImageResponse;
      writeUploadOutput(payload, options.format);
      if (!options.quiet) {
        console.error(`uploaded: ${rawPath} -> ${payload.url}`);
      }
    } catch (error) {
      hasError = true;
      if (!options.quiet) {
        console.error(`upload failed: ${rawPath}: ${formatError(error)}`);
      }
    }
  }

  return hasError ? 1 : 0;
}

function parseUploadArgs(args: string[]): UploadOptions {
  let format: OutputFormat = "url";
  let quiet = false;
  const files: string[] = [];

  for (let idx = 0; idx < args.length; idx += 1) {
    const token = args[idx];
    if (token === "--quiet") {
      quiet = true;
      continue;
    }
    if (token === "--format" && idx + 1 < args.length) {
      const value = args[idx + 1];
      if (value === "url" || value === "markdown" || value === "json") {
        format = value;
      }
      idx += 1;
      continue;
    }
    if (token.startsWith("--format=")) {
      const value = token.slice("--format=".length);
      if (value === "url" || value === "markdown" || value === "json") {
        format = value;
      }
      continue;
    }
    files.push(token);
  }

  return { quiet, format, files };
}

function writeUploadOutput(payload: UploadImageResponse, format: OutputFormat) {
  if (format === "markdown") {
    process.stdout.write(`${payload.markdown}\n`);
    return;
  }
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  process.stdout.write(`${payload.url}\n`);
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function printHelp() {
  console.log(`muyu-upload

commands:
  muyu-upload config show
  muyu-upload config set endpoint <url>
  muyu-upload config set token <token>
  muyu-upload doctor
  muyu-upload upload <file...> [--quiet] [--format url|markdown|json]

defaults:
  upload stdout prints URL lines only; diagnostics go to stderr.
`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile && path.resolve(currentFile) === invokedFile) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}

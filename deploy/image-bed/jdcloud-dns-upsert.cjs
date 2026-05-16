#!/usr/bin/env node
"use strict";

/**
 * Upsert JDCloud DNS record for Wave5 cutover.
 *
 * Requires jdcloud-sdk-js:
 *   npm install --no-save --no-package-lock jdcloud-sdk-js
 *
 * Example:
 *   node deploy/image-bed/jdcloud-dns-upsert.cjs \
 *     --domain woodfish.site --rr img --type A --value 36.151.148.198
 */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function pickResultDataList(resp) {
  if (!isObject(resp)) return [];
  if (Array.isArray(resp.dataList)) return resp.dataList;
  if (isObject(resp.result) && Array.isArray(resp.result.dataList)) return resp.result.dataList;
  return [];
}

function pickResultField(resp, key, fallback) {
  if (!isObject(resp)) return fallback;
  if (Object.prototype.hasOwnProperty.call(resp, key)) return resp[key];
  if (isObject(resp.result) && Object.prototype.hasOwnProperty.call(resp.result, key)) {
    return resp.result[key];
  }
  return fallback;
}

function collectViewNodes(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectViewNodes(item, out);
    }
    return;
  }
  if (!isObject(node)) {
    return;
  }
  const id = Number(node.id);
  const name = String(node.viewName ?? node.name ?? node.label ?? "");
  if (Number.isFinite(id)) {
    out.push({ id, name });
  }

  for (const key of ["childList", "children", "dataList", "viewTree", "nodes"]) {
    if (node[key] !== undefined) {
      collectViewNodes(node[key], out);
    }
  }
}

function pickViewId(viewResp) {
  const candidates = [];
  collectViewNodes(viewResp, candidates);
  if (candidates.length === 0) {
    return 0;
  }
  const named = candidates.find((x) => /默认|default/i.test(x.name));
  if (named) {
    return named.id;
  }
  const zero = candidates.find((x) => x.id === 0);
  if (zero) {
    return 0;
  }
  return candidates[0].id;
}

function normalizeViewValues(value) {
  if (Array.isArray(value)) {
    return value.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  }
  const n = Number(value);
  return Number.isFinite(n) ? [n] : [];
}

function usage() {
  return `
Usage:
  node deploy/image-bed/jdcloud-dns-upsert.cjs --value <IP> [options]

Required:
  --value <IP>                    Target record value, e.g. 36.151.148.198

Options:
  --domain <ROOT_DOMAIN>          Default: woodfish.site
  --rr <HOST_RECORD>              Default: img
  --type <RECORD_TYPE>            Default: A
  --ttl <SECONDS>                 Default: 600
  --region <REGION_ID>            Default: cn-north-1
  --view <VIEW_ID>                Optional fixed line/view id
  --remote-metadata-host <HOST>   Optional SSH host for remote metadata fallback
  --page-size <N>                 Default: 100
  --max-pages <N>                 Default: 30
  --dry-run                       Print plan without writing
  --help                          Show help

Credential source (priority):
  1) --ak / --sk [/ --token]
  2) env JDCLOUD_ACCESS_KEY_ID + JDCLOUD_SECRET_ACCESS_KEY [+ JDCLOUD_SESSION_TOKEN]
  3) env JDCLOUD_AK + JDCLOUD_SK [+ JDCLOUD_SESSION_TOKEN]
  4) metadata instance-role endpoint:
     http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials
  5) remote metadata via SSH host:
     --remote-metadata-host <HOST> or env JDCLOUD_METADATA_SSH_HOST
`;
}

function redact(value) {
  if (!value) return value;
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function pickMetadataCredentialPayload(payload) {
  if (!isObject(payload)) return null;

  const code = String(payload.Code || payload.code || "").toLowerCase();
  const accessKey = String(payload.accessKey || payload.accessKeyId || "").trim();
  const secretKey = String(payload.secretKey || payload.secretAccessKey || "").trim();
  const sessionToken = String(payload.sessionToken || payload.securityToken || "").trim();

  if (!accessKey || !secretKey) {
    return null;
  }
  if (code && code !== "success") {
    return null;
  }

  return {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    sessionToken,
    expiration: payload.expiration || payload.expireTime || null,
    remainingSeconds: payload.remainingSeconds || payload.RemainingSeconds || null,
  };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  if (typeof fetch !== "function") {
    return { ok: false, error: "global fetch unavailable in current Node runtime" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const text = await resp.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: resp.ok, status: resp.status, text, json };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function tryLoadInstanceRoleCredentials() {
  const endpoints = [
    "http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials",
    "http://169.254.169.254/jcs-metadata/latest/iam/instance-role-security-credentials",
  ];

  const diagnostics = [];
  for (const endpoint of endpoints) {
    const res = await fetchJsonWithTimeout(endpoint, 2000);
    if (!res.ok) {
      diagnostics.push({
        endpoint,
        status: res.status ?? null,
        error: res.error || "request failed",
      });
      continue;
    }

    const credential = pickMetadataCredentialPayload(res.json);
    if (credential) {
      return {
        source: "metadata-instance-role",
        endpoint,
        credential,
        diagnostics,
      };
    }

    diagnostics.push({
      endpoint,
      status: res.status ?? 200,
      payload: isObject(res.json) ? res.json : (res.text || "").slice(0, 200),
      error: "no usable credential payload",
    });
  }

  return { source: null, diagnostics };
}

function runRemoteMetadataFetch(host, endpoint) {
  const { spawnSync } = require("node:child_process");
  const command = `curl -sS -m 6 ${endpoint}`;
  const proc = spawnSync("ssh", [host, command], {
    encoding: "utf8",
    timeout: 15000,
  });
  return {
    status: proc.status,
    stdout: proc.stdout || "",
    stderr: proc.stderr || "",
    error: proc.error ? String(proc.error.message || proc.error) : "",
  };
}

async function tryLoadInstanceRoleCredentialsViaSsh(host) {
  const endpoints = [
    "http://169.254.169.254/metadata/latest/iam/instance-role-security-credentials",
    "http://169.254.169.254/jcs-metadata/latest/iam/instance-role-security-credentials",
  ];

  const diagnostics = [];
  for (const endpoint of endpoints) {
    const res = runRemoteMetadataFetch(host, endpoint);
    if (res.status !== 0) {
      diagnostics.push({
        endpoint,
        host,
        status: res.status,
        error: res.error || res.stderr.trim() || "ssh/curl failed",
      });
      continue;
    }

    const text = res.stdout.trim();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const credential = pickMetadataCredentialPayload(json);
    if (credential) {
      return {
        source: "metadata-instance-role-ssh",
        endpoint,
        host,
        credential,
        diagnostics,
      };
    }

    diagnostics.push({
      endpoint,
      host,
      status: 200,
      payload: isObject(json) ? json : text.slice(0, 200),
      error: "no usable credential payload",
    });
  }
  return { source: null, diagnostics };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage().trim());
    return;
  }

  let DomainService;
  let JDCloudRoot;
  try {
    JDCloudRoot = require("jdcloud-sdk-js");
    JDCloudRoot.config.update({ logger: () => {} }, true);
    DomainService = JDCloudRoot.DOMAINSERVICE;
  } catch {
    const { spawnSync } = require("node:child_process");
    const install = spawnSync(
      "npm",
      ["install", "--no-save", "--no-package-lock", "jdcloud-sdk-js"],
      { stdio: "inherit", shell: process.platform === "win32" }
    );
    if (install.status !== 0) {
      console.error("Missing dependency: jdcloud-sdk-js");
      console.error("Auto install failed. Run manually:");
      console.error("npm install --no-save --no-package-lock jdcloud-sdk-js");
      process.exitCode = 2;
      return;
    }
    JDCloudRoot = require("jdcloud-sdk-js");
    JDCloudRoot.config.update({ logger: () => {} }, true);
    DomainService = JDCloudRoot.DOMAINSERVICE;
  }

  let accessKeyId =
    args.ak ||
    args.accessKeyId ||
    process.env.JDCLOUD_ACCESS_KEY_ID ||
    process.env.JDCLOUD_AK;
  let secretAccessKey =
    args.sk ||
    args.secretAccessKey ||
    process.env.JDCLOUD_SECRET_ACCESS_KEY ||
    process.env.JDCLOUD_SK;
  let sessionToken =
    args.token ||
    args.sessionToken ||
    process.env.JDCLOUD_SESSION_TOKEN ||
    process.env.JDCLOUD_SECURITY_TOKEN ||
    process.env.JDCLOUD_TOKEN ||
    "";
  let credentialSource = "args-or-env";
  let metadataDiagnostics = [];
  const remoteMetadataHost = String(
    args["remote-metadata-host"] ||
      process.env.JDCLOUD_METADATA_SSH_HOST ||
      process.env.REMOTE ||
      ""
  ).trim();

  if (!accessKeyId || !secretAccessKey) {
    const metadataResult = await tryLoadInstanceRoleCredentials();
    metadataDiagnostics = metadataResult.diagnostics || [];
    if (metadataResult.source && metadataResult.credential) {
      accessKeyId = metadataResult.credential.accessKeyId;
      secretAccessKey = metadataResult.credential.secretAccessKey;
      sessionToken = metadataResult.credential.sessionToken || sessionToken;
      credentialSource = metadataResult.source;
    }
  }

  if ((!accessKeyId || !secretAccessKey) && remoteMetadataHost) {
    const remoteMetadataResult = await tryLoadInstanceRoleCredentialsViaSsh(remoteMetadataHost);
    metadataDiagnostics.push(...(remoteMetadataResult.diagnostics || []));
    if (remoteMetadataResult.source && remoteMetadataResult.credential) {
      accessKeyId = remoteMetadataResult.credential.accessKeyId;
      secretAccessKey = remoteMetadataResult.credential.secretAccessKey;
      sessionToken = remoteMetadataResult.credential.sessionToken || sessionToken;
      credentialSource = remoteMetadataResult.source;
    }
  }

  if (!accessKeyId || !secretAccessKey) {
    console.error("Missing JDCloud credentials.");
    console.error("Need --ak/--sk or env JDCLOUD_ACCESS_KEY_ID + JDCLOUD_SECRET_ACCESS_KEY.");
    console.error("Fallback tried: metadata instance-role endpoint (/metadata/latest/iam/instance-role-security-credentials).");
    if (remoteMetadataHost) {
      console.error(`Fallback tried: remote metadata via SSH host (${remoteMetadataHost}).`);
    }
    if (metadataDiagnostics.length > 0) {
      console.error(JSON.stringify({ action: "metadata_credential_probe", diagnostics: metadataDiagnostics }, null, 2));
    }
    process.exitCode = 2;
    return;
  }

  const domainName = String(args.domain || "woodfish.site").trim().toLowerCase();
  const hostRecord = String(args.rr || "img").trim();
  const recordType = String(args.type || "A").trim().toUpperCase();
  const desiredValue = String(args.value || "").trim();
  const ttl = toInt(args.ttl, 600);
  const regionId = String(args.region || "cn-north-1").trim();
  const pageSize = toInt(args["page-size"], 100);
  const maxPages = toInt(args["max-pages"], 30);
  const dryRun = Boolean(args["dry-run"]);
  const explicitViewId = args.view !== undefined ? toInt(args.view, NaN) : NaN;

  if (!desiredValue) {
    console.error("Missing --value <IP>.");
    process.exitCode = 2;
    return;
  }

  const clientCredentials = { accessKeyId, secretAccessKey };
  if (sessionToken) {
    clientCredentials.sessionToken = sessionToken;
  }
  const client = new DomainService({
    credentials: clientCredentials,
    regionId,
    logger: () => {},
  });
  const extraHeader = sessionToken ? { "x-jdcloud-security-token": sessionToken } : null;
  const withExtraHeader = (opts) =>
    extraHeader ? { ...opts, "x-extra-header": extraHeader } : opts;

  const summary = {
    action: "jdcloud_dns_upsert",
    credentialSource,
    remoteMetadataHost,
    regionId,
    domainName,
    hostRecord,
    recordType,
    desiredValue,
    ttl,
    dryRun,
    accessKeyId: redact(accessKeyId),
    sessionToken: sessionToken ? redact(sessionToken) : "",
  };

  // 1) resolve domainId + packId
  let foundDomain = null;
  for (let page = 1; page <= maxPages; page += 1) {
    const resp = await client.describeDomains(
      withExtraHeader({ pageNumber: page, pageSize, domainName }),
      regionId
    );
    const list = pickResultDataList(resp);
    const hit = list.find((d) => String(d.domainName || "").toLowerCase() === domainName);
    if (hit) {
      foundDomain = hit;
      break;
    }
    const totalPage = Number(pickResultField(resp, "totalPage", page));
    if (Number.isFinite(totalPage) && page >= totalPage) {
      break;
    }
  }

  if (!foundDomain) {
    throw new Error(`Domain not found in JDCloud DNS: ${domainName}`);
  }

  const domainId = String(foundDomain.id);
  const packId = Number(foundDomain.packId ?? 0);
  summary.domainId = domainId;
  summary.packId = packId;

  // 2) pick default view id
  let viewId = Number.isFinite(explicitViewId) ? explicitViewId : 0;
  if (!Number.isFinite(explicitViewId)) {
    try {
      const viewResp = await client.describeViewTree(
        withExtraHeader({ domainId, packId, viewId: -1, loadMode: 0 }),
        regionId
      );
      viewId = pickViewId(viewResp);
    } catch {
      viewId = 0;
    }
  }
  summary.viewId = viewId;

  // 3) list existing records
  const records = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const resp = await client.describeResourceRecord(
      withExtraHeader({ domainId, pageNumber: page, pageSize, search: hostRecord }),
      regionId
    );
    const list = pickResultDataList(resp);
    records.push(...list);
    const totalPage = Number(pickResultField(resp, "totalPage", page));
    if (Number.isFinite(totalPage) && page >= totalPage) {
      break;
    }
  }

  const targetCandidates = records.filter(
    (r) =>
      String(r.hostRecord || "").toLowerCase() === hostRecord.toLowerCase() &&
      String(r.type || "").toUpperCase() === recordType
  );
  const byView = targetCandidates.filter((r) => {
    const vv = normalizeViewValues(r.viewValue);
    return vv.length === 0 || vv.includes(viewId);
  });

  const target =
    byView.find((r) => String(r.hostValue || "") === desiredValue) ||
    byView[0] ||
    targetCandidates.find((r) => String(r.hostValue || "") === desiredValue) ||
    targetCandidates[0] ||
    null;

  if (!target) {
    const payload = {
      hostRecord,
      hostValue: desiredValue,
      ttl,
      type: recordType,
      viewValue: viewId,
      jcloudRes: false,
    };
    summary.mode = "create";
    summary.payload = payload;

    if (!dryRun) {
      const createResp = await client.createResourceRecord(
        withExtraHeader({ domainId, req: payload }),
        regionId
      );
      summary.requestId = createResp?.requestId || createResp?.result?.requestId || null;
      summary.created = pickResultDataList(createResp);
    }
  } else {
    const inheritedView = normalizeViewValues(target.viewValue);
    const effectiveView = inheritedView[0] ?? viewId;
    const payload = {
      domainName,
      hostRecord,
      hostValue: desiredValue,
      ttl,
      type: recordType,
      viewValue: effectiveView,
      jcloudRes: Boolean(target.jcloudRes),
    };
    if (target.weight !== undefined && target.weight !== null) {
      payload.weight = Number(target.weight);
    }
    if (target.mxPriority !== undefined && target.mxPriority !== null) {
      payload.mxPriority = Number(target.mxPriority);
    }
    if (target.port !== undefined && target.port !== null) {
      payload.port = Number(target.port);
    }

    summary.mode = "modify";
    summary.resourceRecordId = String(target.id);
    summary.before = {
      id: target.id,
      hostRecord: target.hostRecord,
      hostValue: target.hostValue,
      ttl: target.ttl,
      type: target.type,
      viewValue: target.viewValue,
      resolvingStatus: target.resolvingStatus,
    };
    summary.payload = payload;

    if (!dryRun) {
      const modifyResp = await client.modifyResourceRecord(
        withExtraHeader({ domainId, resourceRecordId: String(target.id), req: payload }),
        regionId
      );
      summary.requestId = modifyResp?.requestId || modifyResp?.result?.requestId || null;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const raw = isObject(error) ? error : { message: String(error) };
  const out = {
    action: "jdcloud_dns_upsert",
    error: {
      message: raw.message || "unknown error",
      requestId: raw.requestId || raw?.result?.requestId || null,
      status: raw?.responseObj?.status || null,
      code: raw.code || null,
      data: raw.result || null,
    },
  };
  console.error(JSON.stringify(out, null, 2));
  process.exitCode = 1;
});

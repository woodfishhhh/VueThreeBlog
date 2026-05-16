# Typora + Muyu Upload CLI

## Build CLI

```bash
npm run upload-cli:build
```

Binary path after build:

```txt
packages/upload-cli/dist/cli.js
```

Run manually:

```bash
node packages/upload-cli/dist/cli.js --help
```

## Configure Endpoint and Token

```bash
node packages/upload-cli/dist/cli.js config set endpoint https://img.woodfish.site
node packages/upload-cli/dist/cli.js config set token muyu_xxx
node packages/upload-cli/dist/cli.js doctor
```

`doctor` checks:
- config exists
- endpoint exists
- token exists
- `/api/health` reachable
- `/api/me` token validity

## Typora Custom Command (Windows)

In Typora image upload settings:

- Command:
  - `node`
- Arguments:
  - `C:\path\to\WoodFishNest\packages\upload-cli\dist\cli.js upload --quiet`

Typora sends local file paths as trailing args. CLI prints URL lines to stdout only, so Typora can replace local image paths with returned URLs.

## Optional Output Formats

```bash
node packages/upload-cli/dist/cli.js upload a.png --format markdown
node packages/upload-cli/dist/cli.js upload a.png --format json
```

Default is raw URL lines.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `missing valid endpoint` | endpoint not configured | run `config set endpoint` |
| `missing token` | token not configured | run `config set token` |
| `upload failed: ... HTTP 401` | token invalid/revoked | recreate token in admin UI |
| `upload failed: ... unsupported image` | unsupported file type | use png/jpg/webp/gif |
| Typora no replacement | command writes non-URL stdout | use `upload --quiet` |

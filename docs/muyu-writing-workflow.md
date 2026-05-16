# Muyu Writing Workflow

## Goal

Keep blog runtime static. Upload happens before commit. Markdown stores public URLs.

## Author Workflow

1. In Typora, paste local image.
2. Typora custom command calls:
   - `node packages/upload-cli/dist/cli.js upload --quiet`
3. CLI uploads to `img.woodfish.site`.
4. Typora replaces local path with returned URL.
5. Commit Markdown with stable public URL.

## Markdown Syntax

Preferred:

```md
![alt](https://img.woodfish.site/o/webp/2026/05/hash.webp)
```

Fallback URL (original variant) may be used for GIF/legacy cases.

## Build Contract

- Blog runtime does not call image-bed API.
- `npm run generate:content` and `npm run build` must pass even if API is offline.
- Image URLs are plain public links.

## URL Audit / Migration Prep

Generate URL classification report:

```bash
npm run content-tools:build
node packages/content-tools/dist/cli.js image-report \
  --content-root apps/blog/content \
  --format markdown \
  --output docs/muyu-image-url-report.md
```

Report classes:
- `local-path`
- `legacy-woodfish`
- `muyu`
- `external`

The report is dry-run only and does not modify Markdown files.

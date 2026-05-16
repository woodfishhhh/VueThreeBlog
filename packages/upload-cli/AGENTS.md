# AGENTS.md — packages/upload-cli

CLI tool for uploading images to the muyu image-bed API, designed for use as a **Typora custom image uploader**.

## Commands

```bash
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit
vitest run         # unit tests

# The built CLI binary (after build):
muyu-upload config set --endpoint <URL> --token <JWT>  # configure API credentials
muyu-upload upload image.png                            # upload single image
muyu-upload upload a.jpg b.png                         # upload multiple images
muyu-upload doctor                                     # verify connection to API
muyu-upload --help                                     # show help
```

## Typora Integration

In Typora Preferences → Image → Upload service:
- Custom command: `node /path/to/dist/cli.js upload`

Typora passes image file paths as arguments; the CLI outputs one URL per line (Typora's expected format).

## Source Layout

```
src/
├── cli.ts       # Main CLI: command dispatch (upload, config, doctor, help)
├── config.ts    # Read/write config file (~/.muyu-upload.json), token redaction
└── index.ts     # Re-exports for library use
```

## Configuration

Config stored in `~/.muyu-upload.json`:
```json
{ "endpoint": "https://img.woodfish.site", "token": "<JWT>" }
```

Credentials obtained from `npm run image-bed:api:bootstrap-token` (run once on server).

## Notes

- Output format: one URL per uploaded image, newline-separated (Typora protocol).
- Depends on `@woodfish-nest/shared` for API types.
- See `docs/muyu-typora-upload.md` for the full Typora upload workflow guide.

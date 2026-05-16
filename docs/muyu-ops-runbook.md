# Muyu Ops Runbook

## Log Locations

- API container logs:
  - `docker compose -f deploy/image-bed/docker-compose.prod.yml logs -f image-bed-api`
- Nginx:
  - `/var/log/nginx/access.log`
  - `/var/log/nginx/error.log`

## First Deploy

Follow `deploy/image-bed/README.md` sections 1-5.

## API Upgrade

1. Build/pull new image.
2. `docker compose -f deploy/image-bed/docker-compose.prod.yml up -d`
3. Check health:
   - `curl -fsSL https://img.woodfish.site/api/health`
4. Run smoke:
   - `bash deploy/image-bed/smoke-prod.sh ./test.png`

## Admin Static Deploy

1. Build:
   - `npm run image-bed:web:build`
2. Sync:
   - `rsync -av --delete apps/image-bed-web/dist/ /srv/muyu-admin/`
3. Verify:
   - open `https://img.woodfish.site/admin/`

## Token Creation

Admin token:

```bash
npm run image-bed:api:create-admin
```

Member/user tokens:
- Use admin UI `Tokens` tab.

## Invite Creation

- Use admin UI `Invites` tab.
- Copy invite code once and deliver through trusted channel.

## Backup

Manual:

```bash
bash deploy/image-bed/backup-muyu.sh
```

Disk usage check:

```bash
bash deploy/image-bed/check-disk-usage.sh
```

Recommended cron:

```cron
0 3 * * * /bin/bash /path/to/repo/deploy/image-bed/backup-muyu.sh >> /var/log/muyu-backup.log 2>&1
```

## Restore

1. Stop API container.
2. Restore SQLite backup to `/srv/muyu-data/muyu.sqlite`.
3. Restore image tarball into `/srv/muyu-images`.
4. Start API container.
5. Run smoke test.

Dry-run restore verifier:

```bash
bash deploy/image-bed/restore-muyu-dry-run.sh /srv/muyu-backups/muyu-YYYY.sqlite /srv/muyu-backups/muyu-images-YYYY.tgz
```

## Emergency Token Revoke

- Revoke token via admin UI.
- If UI unavailable, SQL fallback:

```sql
UPDATE tokens SET revoked_at = datetime('now') WHERE id = '<token-id>' AND revoked_at IS NULL;
```

## Disk Full Response

1. Check usage:
   - `df -h`
   - `du -sh /srv/muyu-images /srv/muyu-data /srv/muyu-backups`
2. Delete old backup bundles first.
3. If still full, disable uploads temporarily by firewall/Nginx rule on `/api/upload`.
4. Recover space, then run health + smoke.

## Dependency Audit Process

Run regularly:

```bash
npm run security:audit
```

Policy:
1. Triage `high`/`critical` first.
2. Prefer patch/minor upgrades with changelog review.
3. Re-run full verification (`typecheck`, `test`, `build`) after security upgrades.

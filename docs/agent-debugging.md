# Agent Debugging Commands

Use `vp` as the command surface for local debugging, CI, and handoff logs.
Agent tasks live in `vite.config.ts` under `run.tasks`, so Vite+ can fingerprint inputs, cache outputs, and print task summaries.

## Default Loop

```bash
npx vp run agent:fast
npx vp run agent:static
npx vp run agent:test tests/config/vite-config.test.ts
npx vp run agent:dist
npx vp run --last-details
```

## Command Map

| Goal                      | Command                                                    |
| ------------------------- | ---------------------------------------------------------- |
| Fast edit feedback        | `npx vp run agent:fast`                                    |
| Full static checks        | `npx vp run agent:static`                                  |
| Unit tests                | `npx vp run agent:test`                                    |
| Focused test              | `npx vp run agent:test tests/content/post-helpers.test.ts` |
| Verbose test output       | `npx vp run agent:test --reporter verbose`                 |
| Dist build + asset check  | `npx vp run agent:dist`                                    |
| Everything before handoff | `npx vp run agent:full`                                    |
| Autofix safe style issues | `npx vp run agent:fix`                                     |
| Inspect plugins/modules   | `npx vp run agent:inspect`                                 |
| Generate content          | `npx vp run content:generate`                              |
| CI content generation     | `npx vp run content:generate:ci`                           |
| Build app                 | `npx vp run app:build`                                     |
| Last task details         | `npx vp run --last-details`                                |

## Failure Triage

1. Run the narrowest failing command again with `-v`, for example `npx vp run -v agent:test tests/config/vite-config.test.ts`.
2. Read the failing task command and exit code from `npx vp run --last-details`.
3. Use `agent:fix` only for formatting/lint autofix; rerun `agent:static` after it.
4. Use `agent:dist` when changes touch config, routing base paths, content generation, or build output.

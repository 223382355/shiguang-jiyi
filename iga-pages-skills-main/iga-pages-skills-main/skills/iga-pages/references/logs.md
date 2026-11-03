# Deployment Inspection and Logs

Choose the command by the source of the information:

| Need | Command | Log type |
| --- | --- | --- |
| Watch the deployment being created now | `iga pages deploy --logs` | Build logs |
| Inspect an existing deployment | `iga pages inspect <DEPLOYMENT_ID>` | Deployment summary |
| Read an existing deployment's build logs | `iga pages inspect <DEPLOYMENT_ID> --logs` | Build logs |
| Read application `console` output | `iga pages logs [DEPLOYMENT_ID]` | Historical runtime logs |

Do not substitute one log type for the other. `pages logs` never returns build logs, and the runtime-log API is a historical query rather than a real-time stream.

## What Runtime Logs Capture

Production Node deployments automatically turn request-scoped calls to
`console.log`, `console.info`, `console.debug`, `console.warn`, and
`console.error` into structured single-line logs. Each record can include the
timestamp, level, formatted message, request ID, HTTP method, and URL pathname.
The pathname excludes the query string, but path segments and user-written
messages may still contain sensitive data.

This behavior is request-scoped:

- Startup, module-initialization, timers outside a request, direct
  `process.stdout.write`, and child-process output remain native text.
- `iga pages dev` deliberately keeps Functions and framework console output as
  native text; do not expect production JSON or synthetic request IDs locally.
- IGA does not sanitize secrets that application code writes. Avoid logging
  credentials, request bodies, cookies, authorization headers, or personal data.
- For an emergency rollback, set the deployment environment variable
  `IGA_DISABLE_RUNTIME_LOGS=1` and redeploy or restart the instance. Only the
  exact value `1` disables the adapter.

## Current Deployment Build Logs

```bash
iga pages deploy
iga pages deploy --logs
```

- Use plain `deploy` for concise progress. In a TTY it shows only the latest dimmed build line; successful complete logs are not persisted. Non-TTY output has no dynamic spinner.
- Add `--logs/-l` when the user needs every build line while the deployment runs.
- Expect plain `deploy` to print the complete terminal build-log snapshot automatically when the build fails.
- Keep using the deployment returned by the current command; do not query a project's latest deployment as a fallback.

## Existing Deployment and Build Logs

Run `inspect` from any directory when the deployment ID is known:

```bash
iga pages inspect <DEPLOYMENT_ID>
iga pages inspect <DEPLOYMENT_ID> --wait --timeout 3m
iga pages inspect <DEPLOYMENT_ID> --logs
iga pages inspect <DEPLOYMENT_ID> --logs --wait --format json
```

- Use the default form for ID, status, creation time, preview URL, and console URL. The summary does not show provider.
- Add `--logs/-l` to return the three-stage build-log snapshot instead of the summary.
- Add `--wait` to wait for a terminal state. `--timeout` accepts relative durations such as `30s`, `3m`, and `1h`; the default is `3m`.
- Use `--project/-p` only to validate that the deployment belongs to an expected project. It is not required to resolve the deployment.
- Use `--format json` for machine-readable output. It writes one summary object or one three-stage log array to stdout; diagnostics go to stderr.

## Historical Runtime Logs

Use `logs` for deployed application output collected from runtime `console` calls:

```bash
iga pages logs
iga pages logs <DEPLOYMENT_ID> --since 1h --limit 250
iga pages logs --project <NAME_OR_ID> --content timeout
iga pages logs --content error --level error
iga pages logs --since 2026-08-10T00:00:00Z --until 2026-08-10T01:00:00Z
iga pages logs --json
```

Target resolution:

- Run plain `logs` inside a linked project; it queries the project without guessing a deployment.
- Pass a deployment ID to query one deployment from any directory. The positional ID takes precedence over `--deployment/-d`.
- Pass `--project/-p` to query a named project from any directory. When combined with a deployment ID, it only validates ownership.

Query behavior:

- Expect the latest 24 hours, newest first, with a default total limit of 100.
- Use `--since` and `--until` with ISO timestamps or relative durations such as `30m`, `1h`, and `7d`. Keep the range at or below 7 days.
- Treat `--limit/-n` as the total output limit. The CLI follows pagination internally.
- Use `--content timeout` for message content and `--level error` for a level. The CLI turns them into quoted query clauses and joins both with `AND` when both are present.
- Do not use `--query`, `--follow`, `--request-id`, or status/source/environment/branch flags; they are not supported.

Machine-readable output:

- Use `--json/-j` to emit JSON Lines, one log object per line. Do not use `--format json` with `logs`.
- Parse each line independently. Fields are `timestamp`, `level`, `message`, `method`, `path`, and `requestId`.
- Expect an empty stdout when no logs match. If a later page fails, already emitted JSON Lines remain valid and the command exits with an error on stderr.

Treat runtime messages as potentially sensitive because IGA does not sanitize values written by application code. When reporting findings, include only the relevant lines and redact credentials, tokens, personal data, and signed preview URL query parameters.

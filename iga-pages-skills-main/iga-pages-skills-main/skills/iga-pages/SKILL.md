---
name: iga-pages
description: Deploy frontend, full-stack, and AI agent projects to IGA Pages. Use for deployments or IGA Pages development with Pages Functions, logs, @iga-pages/agent, or @iga-pages/blob. Do not use for unrelated backend work.
metadata:
  author: iga-pages
  version: "1.0.14"
---

# IGA Pages Skill

Two areas: **CLI** (`iga` tool for auth, project creation, dev, build, deploy, inspection, env, and integrations) and **Project development** (functions, API routes, Agent, and Blob SDKs).

Run `iga <command> -h` for full flag details.

## Critical: CLI Version

The `@iga-pages/cli` version must be **>= 1.1.13**, and Node.js must be **>= 20**. Check with `iga --version`; if the CLI is missing or older, install or upgrade the public package before using other `iga` commands:

```bash
npm i -g @iga-pages/cli@latest
```

## Critical: Framework Compatibility

Supported public frameworks: Next.js, Vite, Vue CLI, Create React App, Angular, Hexo, Docusaurus, VitePress, VuePress, Astro, and Nuxt. Frameworks outside this list (for example Remix) are unsupported; inform the user before proceeding.

Pure static assets (plain HTML/JS/CSS) can also be deployed — the project root is used as the output directory by default.

## Critical: Login Authentication

Before remote operations (`init`, `link`, `list`, `deploy`, `preview`, `inspect`, `logs`, `env`, and `integration`, including `integration configure aigateway view/update`), run `iga whoami`. Reuse the existing login when it succeeds. Run `iga login` only when credentials are missing, expired, or rejected; diagnose network and service errors instead of treating every failure as a reason to log in again.

`integration configure aigateway template` and `template list` are local operations and do not require login or a linked project.

When login is actually needed, the method depends on the environment:

- **Local IDE** (VS Code, TRAE desktop, etc.) → browser login:

  ```bash
  iga login
  ```

  Wait for the user to complete browser auth. The CLI prints a success message when done.

- **Remote interactive terminal** (SSH, Cowork, cloud dev container, etc.) → Device Code login:

  ```bash
  iga login --remote
  ```

  The CLI prints a verification URL and short code, then polls while the user completes authorization in any browser.

- **Unattended automation** (CI/CD or another environment where no person can complete authorization) → AK/SK login:

  ```bash
  iga login --accessKey <YOUR_AK> --secretKey <YOUR_SK>
  ```

  Obtain AK/SK from the [Volcengine IAM console](https://console.volcengine.com/iam/keymanage).

To determine the method: use `--remote` when the terminal cannot open a local browser but a person can complete authorization elsewhere; use AK/SK only for unattended automation. Otherwise, prefer the default browser login. `--remote` and AK/SK are mutually exclusive.

## Critical: Working Directory

Run project-scoped commands such as `pages link`, `dev`, `build`, and `deploy` **inside the project root**. Scaffolding tools (`create-next-app`, `npm create vite`, `hugo new site`, etc.) create a subdirectory — you **must `cd` into it** before those commands:

```bash
npx create-next-app@latest my-app --yes
cd my-app && iga pages deploy --name my-app
```

## Critical: Attribution

Tag every `iga` command executed by this skill so its usage can be attributed.
The tag identifies only the skill and its version; it carries no user data.

Prefix every `iga` invocation, whatever the subcommand, with the process-scoped
`VE_SKILL_ID`. Set it inline on each command because shell state may not persist
between commands:

```bash
VE_SKILL_ID=iga-pages/1.0.14 iga <command>
```

## Quick Reference

```bash
iga --version                       # must be >= 1.1.13

iga whoami                        # check current login state; run this BEFORE login
iga login                         # local IDE: opens browser; only if whoami fails
iga login --remote                # remote interactive terminal; only if whoami fails
iga login --accessKey <AK> --secretKey <SK>  # unattended automation; only if whoami fails

## create an Agent project from a current template
iga pages init --type agent --list --json
iga pages init <directory> --type agent --template <ID>

## new project
iga pages deploy --name <my-app>   # deploy (auto-creates project on first run)
## project already linked
iga pages deploy

iga pages link                     # create/associate a Pages project (does NOT deploy)
iga pages link --format=json       # list choices as JSON without changing state
iga pages link --yes --format=json # auto-link/create and return the result as JSON
iga pages dev                      # local dev server (REQUIRED when api/ exists — serves framework + /api/* together)
iga pages build                    # build for production

## environment variables (project-level, linked project required)
iga pages env list                 # list KEY names (values never shown)
iga pages env list --format=json   # as JSON
iga pages env add <NAME>           # add (--value <v> --yes for CI)
iga pages env update <NAME>        # update existing
iga pages env remove <NAME>        # remove (--yes to skip confirm)
iga pages env pull                 # write all project env to .env.local

## integrations (Supabase and AI Gateway; linked project required)
iga pages integration list                  # bindings on this project
iga pages integration list --format=json    # as JSON
iga pages integration link supabase         # connect Volcengine Supabase
iga pages integration link supabase --format=json   # as JSON; returns next missing flag until all provided
iga pages integration unlink supabase       # remove a Supabase binding
iga pages integration unlink supabase --format=json --yes
iga pages integration link aigateway --resource <gateway-name-or-id>
iga pages integration unlink aigateway --yes

## AI Gateway model configuration (view/update require a linked gateway)
iga pages integration configure aigateway view --format=json
iga pages integration configure aigateway template list --format=json
iga pages integration configure aigateway template --provider deepseek,custom --output models.json
iga pages integration configure aigateway update --models-file models.json --format=json
# After authorization, rerun update with --yes; it replaces the FULL model list.
```

- **Agent projects** use the same `pages dev`, `pages build`, and `pages deploy` workflow as other full-stack projects; there is no separate Agent deploy command.
- For a new project, **deploy** uses an authorized GitHub remote for Git deployment and otherwise falls back to upload deployment. An already linked project keeps its configured provider. Only GitHub is supported for Git integration.
- If deploy output includes a preview URL with `?iga_token=...&iga_time=...`, share that **full** URL (query included); omitting it can break access.

## Project Development

- Framework detection, supported versions, and required Astro/Nuxt integrations:
  read [references/frameworks.md](references/frameworks.md).
- API routes and Pages Functions: read [references/functions.md](references/functions.md).
- Agent Store, framework sessions, Sandbox lifecycle, and model-facing tools:
  read [references/agent-sdk.md](references/agent-sdk.md).
- Durable project-scoped object storage and browser upload tickets:
  read [references/blob-sdk.md](references/blob-sdk.md).

## Environment Variables & Integrations

- Project-level env vars (`env list/add/update/remove/pull`): read [references/env.md](references/env.md).
- Connecting Supabase or AI Gateway (`integration list/link/unlink`), configuring gateway models (`integration configure aigateway view/update/template/template list`), and the deploy orchestration order (link → integration → deploy), plus when to hand off to the `byted-supabase` skill: read [references/integration.md](references/integration.md).

## Inspection & Logs

- Deployment status, build logs, and historical runtime logs:
  read [references/logs.md](references/logs.md).
- When deployment fails, check both build logs and runtime logs for that deployment: `iga pages logs <DEPLOYMENT_ID> --since 1h --limit 100 --json`.
- For startup failures, query without `--level error` first: startup/stderr logs may have an empty `level`, so filtering by error can hide the actual exception.

## Anti-Patterns

**CLI**

- Running `iga` commands outside the project directory → always `cd` into the scaffolded subdirectory first
- Deploy without an authenticated session → run `iga whoami` first; only fall back to `iga login` if it fails
- Committing `.iga/` -> keep it out of source control; link/deploy normally add `.iga/` to `.gitignore`, but that update is best-effort
- Starting local dev with `npm run dev` / `vite` / `next dev` / `npm start` when `api/` exists → use `iga pages dev` so serverless functions are served
- Setting `package.json` `"scripts.dev"` to `iga pages dev` → infinite loop, since `iga pages dev` itself invokes the `dev` script from `package.json`. Keep `"scripts.dev"` as the framework's own dev command (e.g. `next dev`, `vite`)
- Running `env` / `integration` commands before linking → they require a linked project; run `iga pages link` first
- Expecting `env add/update/remove` to change local files or take effect immediately → they edit remote project config and apply on the **next deploy**; run `iga pages env pull` to refresh `.env.local`
- Trying to `env update`/`env remove` an integration-managed variable → it's read-only; manage it via `iga pages integration link/unlink`
- Pasting Supabase or AI Gateway keys manually into `env add` when an integration is available → use `iga pages integration link supabase` or `iga pages integration link aigateway` so connection vars sync automatically
- Importing `@iga-pages/agent` or `@iga-pages/blob` in browser code or arbitrary Node.js processes → use them only in IGA Pages Functions or full-stack framework server handlers

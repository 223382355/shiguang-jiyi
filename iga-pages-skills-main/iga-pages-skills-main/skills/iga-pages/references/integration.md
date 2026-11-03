# Integrations (`iga pages integration`)

Connect an existing **Volcengine Supabase** or **AI Gateway** resource to the Pages project so its connection variables are synced as project env. The `list/link/unlink` commands manage the IGA-side binding. The `configure aigateway` commands below view or update the linked gateway instance’s model configuration.

`list/link/unlink` and `configure aigateway view/update` require the directory to be linked to a Pages project (run `iga pages link` first). `template` and `template list` are local operations and do not require login or a linked project. Binding changes take effect on the **next deployment**.

```bash
iga pages integration list         # bindings on the current Pages project
iga pages integration list --format=json    # as JSON
```

Synced variables are injected into deployments automatically. Run `iga pages env pull` only when you need them in local `.env.local`; see [env.md](env.md).

## Supabase

```bash
iga pages integration link supabase             # interactive
iga pages integration link supabase --format=json   # as JSON; returns next missing flag until all provided
iga pages integration unlink supabase            # interactive: pick a binding to remove
iga pages integration unlink supabase --format=json --yes
```

Non-interactive link (all selection flags required when there's no TTY):

```bash
iga pages integration link supabase \
  --product volc_supabase \
  --region cn-beijing \
  --resource <workspace-name-or-id> \
  --branch <branch-name-or-id> \
  --yes
# --prefix and --framework-prefix are both optional:
#   --framework-prefix is auto-detected from the framework; pass it only to override.
#   --prefix is optional for the first Supabase binding; required from the second binding onward.
```

Non-interactive unlink:

```bash
iga pages integration unlink supabase --product volc_supabase \
  --resource <workspace-name-or-id> --branch <branch-name-or-id> --yes
```

Key behaviors:

- The integration name is `supabase`. Only **Volcengine Supabase** is supported; `--product` defaults to `volc_supabase` and can be omitted. Other product values, including `supabase` and `comm_supabase`, are rejected.
- **`--resource` / `--branch`** match either the display name (`WorkspaceName` / `Branch`) or the stable ID (`WorkspaceID` / `BranchID`). Ambiguous matches in non-TTY error out — pass a unique ID.
- **`--framework-prefix`** (optional) is the client-exposed env prefix (`NEXT_PUBLIC`, `VITE`, `PUBLIC`, `REACT_APP`). The CLI auto-detects the framework and uses it as the default; in TTY it prompts for confirmation, in non-TTY it uses the detected value silently. Pass `--framework-prefix` only to override the detected default.
- **`--prefix`** (custom prefix) is **optional for the first** Supabase binding but **required from the second onward**, to avoid env name collisions. Uniqueness is enforced by the backend; on a conflict the CLI surfaces the error and re-prompts.
- **Resulting var names**: client vars are `<framework-prefix>_<custom-prefix?>_SUPABASE_<KEY>`; server-only vars omit the framework prefix. The service-role key is **not** auto-synced.
- **`unlink`** removes the IGA binding and the env vars that binding created (backend-driven, by binding relationship — the CLI never deletes env by name). It does not touch anything in Supabase. Confirmation required in TTY; non-TTY needs `--yes` plus full locating flags. `--format=json` requires `--yes`.

## AI Gateway

```bash
iga pages integration link aigateway           # interactive: select an existing gateway
iga pages integration link aigateway --format=json  # returns choices as needs_input
iga pages integration link aigateway --resource <gateway-name-or-id> --format=json
iga pages integration unlink aigateway --resource <gateway-name-or-id> --yes --format=json
```

- `--resource` matches a gateway name or ID. For non-interactive linking, supply it; use an ID when names are ambiguous. JSON output returns `needs_input` and choices when selection is required. If no gateway exists, create one in the console before linking.
- Each Pages project can bind one gateway. Check `integration list` first and reuse the required binding; unlink the existing gateway before binding another.
- The product is `ai_gateway`; `--product` is optional.
- `unlink aigateway` removes the binding and its project environment variables, not the gateway instance. Without `--yes`, JSON output returns `needs_confirmation`; rerun with `--yes` once unlinking is authorized.

### Model configuration (`configure aigateway`)

```bash
# Inspect the linked gateway; model and instance API keys are masked.
iga pages integration configure aigateway view --format=json

# List template providers (local, read-only).
iga pages integration configure aigateway template list --format=json

# Generate a local JSON array template for one or more providers.
iga pages integration configure aigateway template \
  --provider deepseek,custom --output models.json

# Edit the file with the complete desired model list and real credentials,
# then request a masked confirmation preview (does not update the gateway).
iga pages integration configure aigateway update \
  --models-file models.json --format=json

# Once updating this gateway is authorized:
iga pages integration configure aigateway update \
  --models-file models.json --format=json --yes
```

- **Scope:** `view/update` resolve the current project's unique linked gateway; they do not accept `--resource`. Link the project and gateway first. `update` changes the **gateway instance**, so other projects using that gateway may also be affected.
- **Full replacement:** `update` replaces the entire `MaasAPI.Models` array, rather than appending or merging models. Include every model that should remain. Other gateway instance settings are preserved; the instance is not deleted.
- **Template options:** `--provider` accepts comma-separated provider names; use `template list` for the supported names. Without it, the template contains DeepSeek and custom examples. `--output` (alias `-o`) defaults to `models.json`. Both template commands support `--format=json`. Overwriting an existing file requires confirmation or `--yes`; JSON mode without `--yes` returns `file_exists`.
- **File format:** the top-level value must be a JSON array containing 1–50 models. Generate a provider-specific template instead of guessing its fields. Most templates contain `Provider`, `Model`, `Category`, `APIKey`, `Source`, and `Weight`; Agent Plan omits `Model` and `Category`, and custom providers additionally require `BaseURL` and a non-empty `APIKey`. If supplied, `Weight` must be an integer from 0 to 100.
- **Credentials:** fill in real credentials locally. `view` output is masked and uses a display schema, so it cannot be reused directly as an update file. Do not commit credential-bearing `models.json` files or print their contents in logs.
- **Confirmation:** JSON `update` without `--yes` returns `needs_confirmation` with a masked preview and does not write changes. Rerun with `--yes` after authorization. Non-TTY updates require `--yes`; TTY updates prompt when it is omitted.
- After a successful update, the CLI directs you to deploy for changes to take effect and to run `iga pages env pull` when local configuration needs refreshing.

## Deploy orchestration

The IGA Pages skill is the **orchestrator** for the deploy flow. Recommended order when a user wants to deploy a project that may use an integration:

1. Ensure logged in with `iga whoami`; only run `iga login` if `whoami` fails.
2. If the directory is not linked yet, run `iga pages link` to create/associate the Pages project (this no longer deploys). If it is already linked, continue without relinking.
3. If Supabase or AI Gateway usage is detected, run `iga pages integration list`. Reuse the required binding. If it is absent, confirm the resource to connect unless the user has already specified it and authorized binding.
4. For a missing binding, connect the selected resource with `iga pages integration link supabase` or `iga pages integration link aigateway --resource <gateway-id>`.
5. `iga pages deploy`.

## Supabase provider work → hand off to `byted-supabase`

This skill orchestrates link / integration / env / deploy and supports model configuration on the linked AI Gateway instance. It does **not** manage Supabase resources (creating workspaces/branches, SQL, migrations, API keys, Storage, Edge Functions). When the user wants to create or manage actual Supabase resources, hand off to the `byted-supabase` skill (`https://github.com/bytedance/agentkit-samples/blob/main/skills/byted-supabase/SKILL.md`). After it finishes, return and confirm with the user before continuing link / integration / deploy — don't auto-continue.

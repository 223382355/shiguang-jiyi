# Server-side Agent SDK

Use `@iga-pages/agent` only in Pages Functions or full-stack framework server
handlers running through IGA Pages. It is unavailable in browser bundles,
Client Components, static-only sites, and arbitrary Node.js processes.

Install it as a direct dependency so `iga pages dev` can detect the runtime:

```bash
npm install @iga-pages/agent
```

Import from the public subpath matching the task:

| Need                                       | Import                                 |
| ------------------------------------------ | -------------------------------------- |
| Conversation and message storage           | `@iga-pages/agent/store`               |
| OpenAI Agents session                      | `@iga-pages/agent/store/openai`        |
| LangGraph checkpoint persistence           | `@iga-pages/agent/store/langgraph`     |
| Claude Agent session store                 | `@iga-pages/agent/store/claude`        |
| Sandbox lifecycle and operations           | `@iga-pages/agent/sandbox`             |
| Portable Sandbox tools                     | `@iga-pages/agent/tools`               |
| OpenAI SDK tools                           | `@iga-pages/agent/tools/openai`        |
| OpenAI Agents SDK tools                    | `@iga-pages/agent/tools/openai-agents` |
| Claude Agent SDK tools                     | `@iga-pages/agent/tools/claude`        |
| LangChain, LangGraph, and DeepAgents tools | `@iga-pages/agent/tools/langchain`     |

Do not import from the package root or `/host` subpaths. Store records,
framework sessions, Sandbox files, and Blob objects have independent
lifecycles.

## Store API

Import the shared Store client:

```ts
import { store, StoreError } from "@iga-pages/agent/store";
```

| Resource      | Operations                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Conversations | `createConversation`, `getConversation`, `listConversations`, `updateConversation`, `deleteConversation`           |
| Messages      | `appendMessage`, `appendMessages`, `getMessage`, `listMessages`, `updateMessage`, `deleteMessage`, `clearMessages` |

Use the exported input and result types:

```ts
const { conversationId } = await store.createConversation({
  metadata: { title: "Research session" },
});

await store.appendMessage({
  conversationId,
  role: "user",
  type: "message",
  payload: { content: "Summarize the uploaded report." },
});
```

Important behavior:

- Omitting `conversationId` from `createConversation` generates a UUID.
- Appending to a missing conversation creates it. Reuse caller-supplied message
  IDs and identical inputs when retrying.
- `appendMessages` accepts 1-100 items and writes the batch atomically.
- List limits are 1-100. Treat cursors as opaque. Compare message `seq` with
  `BigInt`, not string ordering.
- Conversation metadata updates merge top-level keys. A top-level `null`
  removes that key; nested objects and arrays are replaced.
- Message updates change only supplied fields, but supplied message metadata
  replaces the complete metadata object.
- Deletes and `clearMessages` are idempotent. Clearing retains the conversation
  and its metadata.

Store native framework items or application JSON directly in `payload`.
Application logs should not share a conversation with model history.

## OpenAI Session API

```ts
import { createSession } from "@iga-pages/agent/store/openai";

const session = createSession(conversationId);
const result = await run(agent, input, { session });
```

Reuse the same authorized conversation ID on subsequent turns. Let the adapter
record model items instead of appending them manually. The adapter treats every
message in the conversation as history; keep business events elsewhere.
`clearSession()` clears messages but retains the conversation.

## LangGraph Checkpoints

Install compatible LangGraph dependencies:

```bash
npm install @langchain/langgraph @langchain/langgraph-checkpoint@^1.1.4
```

Create the conversation first and use its ID as `configurable.thread_id`:

```ts
import { store } from "@iga-pages/agent/store";
import { createCheckpointer } from "@iga-pages/agent/store/langgraph";

const graph = builder.compile({ checkpointer: createCheckpointer() });
const { conversationId } = await store.createConversation();
const config = { configurable: { thread_id: conversationId } };

await graph.invoke(input, config);
const state = await graph.getState(config);
```

Checkpoints are separate from Store messages. Prefer normal graph APIs.

## Claude Session Store API

```bash
npm install '@anthropic-ai/claude-agent-sdk@>=0.2.113 <0.4'
```

```ts
import { createSessionStore } from "@iga-pages/agent/store/claude";

const sessionStore = createSessionStore();
const response = query({ prompt, options: { sessionStore } });
```

Capture Claude's returned `session_id` and pass it as `options.resume` on the
next turn with the same store and project identity. Claude session IDs and IGA
conversation IDs are distinct. The adapter persists transcripts only.

## Sandbox Lifecycle API

Choose a Sandbox constructor by the identity you need:

```ts
import {
  connectSandbox,
  createSandbox,
  getConversationSandbox,
  isAbortError,
  SandboxError,
} from "@iga-pages/agent/sandbox";
```

| Constructor                              | Use                                                            |
| ---------------------------------------- | -------------------------------------------------------------- |
| `getConversationSandbox(conversationId)` | Reuse a Sandbox associated with an authorized conversation     |
| `createSandbox()`                        | Create a detached Sandbox and persist its returned `sandboxId` |
| `connectSandbox(sandboxId)`              | Reconnect to an exact detached Sandbox                         |

```ts
const sandbox = getConversationSandbox(conversationId);
const info = await sandbox.getInfo({ abortSignal: request.signal });

await sandbox.extendTimeout(30, { abortSignal: request.signal });
await sandbox.destroy();
```

Conversation Sandboxes may be recreated after expiry. Detached Sandboxes retain
exact identity. Sandbox files are ephemeral; save durable outputs with
`@iga-pages/blob`.

## Sandbox Data-plane Modules

A Sandbox exposes `code`, `shell`, `file`, and `browserPage`:

```ts
const codeResult = await sandbox.code.executeCode(
  { language: "python", code: "print('hello')" },
  { abortSignal: request.signal },
);

const fileResult = await sandbox.file.readFile(
  { file: "/tmp/output.txt" },
  { abortSignal: request.signal },
);
```

Use TypeScript declarations for complete inputs and response shapes. Check the
`ok` discriminator before reading data. Pass an `AbortSignal` for request-scoped
cancellation; aborting does not roll back completed writes or destroy a shared
Sandbox.

### File transfer

Use `file.writeFile` and `file.readFile` for text. For bounded binary content,
use Base64 with an application size limit. Store large or durable files with
`@iga-pages/blob`.

`browserPage.uploadFile` uploads a file already present inside the Sandbox to a
web page. It does not transfer server-side bytes into the Sandbox.

## Model-facing Tools API

Choose the framework-specific import from the table above. Every Tools entry
exports `getTools(sandbox)`. Select only needed capabilities:

```ts
import { getConversationSandbox } from "@iga-pages/agent/sandbox";
import { getTools } from "@iga-pages/agent/tools";

const sandbox = getConversationSandbox(conversationId);
const tools = getTools(sandbox);
const modelTools = [tools.files_read, tools.files_search, tools.code_run];
```

```text
shell_exec
files_read
files_write
files_list
files_search
files_find
code_run
browser_fetch
browser_screenshot
```

Use direct properties or `tools.get(name)` for restricted selection. Domain
helpers grant the complete domain. Use `tools.all()` only after authorizing all
nine capabilities. Portable tools return a discriminated result:

```ts
const result = await tools.code_run.execute(
  { language: "python", code: "print(sum(range(101)))" },
  { abortSignal: request.signal },
);

if (result.status === "error") {
  throw new Error(result.error.message);
}
```

Shell, file writes, browser access, network access, and code execution are
separate privileges. Validate dynamic tool names against an application-owned
allowlist and add application policy before exposing powerful tools to
untrusted users.

## Errors

Catch `StoreError` for Store failures and `SandboxError` for lifecycle failures.
Sandbox operations usually report failure through their response. Use
`isAbortError(error)` to recognize cancellation.

Do not forward SDK error details or upstream status codes directly to clients.
Choose application-level HTTP statuses and retry policies based on the
operation. A failure does not prove that a write did not complete, so use stable
IDs for retried writes.

## Local Development and Runtime

Use Node.js 20 or newer and run Agent applications with:

```bash
iga pages dev
```

Local SDK calls use the linked project's real resources. Runtime credentials
and project scope are supplied automatically; do not configure project IDs,
service tokens, or request-context wrappers in application code.

For SSR frameworks, put server endpoints in the framework's own server routes.
Production skips root `api/` routes when an SSR entry exists.

When process-local state must remain on the same production instance, send
`x-iga-pages-conversation-id` with the authorized conversation ID on related
requests. This provides instance affinity only, not authentication or durable
storage. Use a fetch-based SSE client when a custom header is required.

## Security

The SDK does not authenticate users or authorize resource ownership.
Authenticate the caller and authorize every Conversation, Sandbox ID, and Blob
key prefix before invoking SDK methods. Resource IDs are identifiers, not
credentials.

Never return or log raw SDK causes, signed URLs, runtime credentials, model
keys, authorization headers, or complete request bodies.

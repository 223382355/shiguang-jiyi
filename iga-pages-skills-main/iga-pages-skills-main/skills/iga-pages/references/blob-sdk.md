# Server-side Blob SDK

`@iga-pages/blob` provides durable, project-scoped object storage for Agent
artifacts, files, images, and general application data. Use it only in IGA Pages
Functions or full-stack framework server handlers. Browser and Client Component
code must call a server handler or use a server-issued upload ticket.

Use the application APIs below. The host entrypoint is reserved for the platform.

Add Blob as a direct dependency so `iga pages dev` can detect the runtime
requirement:

```bash
npm install @iga-pages/blob
```

## Package API

`@iga-pages/blob` exports two runtime values:

```ts
import { blob, BlobError } from "@iga-pages/blob";
```

`blob` is a reusable project-scoped object implementing `BlobStore`. Importing it does
not read runtime configuration or perform I/O. Each operation resolves the trusted
project identity automatically. There is no namespace selection or namespace listing API.

Pass `abortSignal` in each operation's options. Cancellation covers credential waiting,
requests, retries, pagination, upload metadata lookup, and returned response streams.
Shared credential refresh continues for other callers. Cancellation does not roll back
writes; cancelling URL signing does not cancel a later upload using that URL.

## BlobStore API

`BlobStore` exposes every operation below:

```ts
blob.set(
  key: string,
  body: BlobBody,
  options?: {
    contentType?: string;
    onlyIfNew?: boolean;
    abortSignal?: AbortSignal;
  },
): Promise<BlobObject>

blob.setJSON(
  key: string,
  value: unknown,
  options?: {
    onlyIfNew?: boolean;
    abortSignal?: AbortSignal;
  },
): Promise<BlobObject>

blob.get(
  key: string,
  options?: { format?: "text"; abortSignal?: AbortSignal },
): Promise<string | null>

blob.get<T>(
  key: string,
  options: { format: "json"; abortSignal?: AbortSignal },
): Promise<T | null>

blob.get(
  key: string,
  options: { format: "arrayBuffer"; abortSignal?: AbortSignal },
): Promise<ArrayBuffer | null>

blob.get(
  key: string,
  options: { format: "blob"; abortSignal?: AbortSignal },
): Promise<Blob | null>

blob.get(
  key: string,
  options: { format: "stream"; abortSignal?: AbortSignal },
): Promise<ReadableStream<Uint8Array> | null>

blob.info(key: string, options?: { abortSignal?: AbortSignal }): Promise<BlobObject | null>
blob.delete(key: string, options?: { abortSignal?: AbortSignal }): Promise<void>

blob.list(options?: {
  prefix?: string;
  directories?: boolean;
  paginate?: boolean;
  cursor?: string;
  abortSignal?: AbortSignal;
}): Promise<ListBlobsResult>

blob.createUploadUrl(
  key: string,
  options?: { onlyIfNew?: boolean; abortSignal?: AbortSignal },
): Promise<BlobUploadTicket>
```

`BlobBody` accepts `string`, `ArrayBuffer`, `ArrayBufferView`, `Blob`, or
`ReadableStream<Uint8Array>`. `setJSON` serializes the value and supplies
`application/json`. Writes overwrite by default; `onlyIfNew: true` rejects an
existing key with a conflict.

`get` defaults to text. A missing object returns `null` for every format.
`delete` is idempotent.

## Result Objects

```ts
interface BlobObject {
  key: string;
  etag?: string;
  size?: number;
  contentType?: string;
  lastModified?: string;
}

interface ListBlobsResult {
  blobs: BlobObject[];
  directories?: string[];
  cursor?: string;
}

interface BlobUploadTicket {
  key: string;
  url: string;
  method: "PUT";
  expiresAt: number; // Unix timestamp in seconds
}
```

`list({ directories: true })` includes immediate child directory names instead
of flattening nested keys. Listing automatically follows every page unless
`paginate: false`; in that mode, pass the returned opaque `cursor` back
unchanged.

Without a prefix, `blob.list()` lists the entire current project. Keys in results are
complete project-relative keys (for example `reports/daily/a.json`), never physical keys.

The SDK never returns the underlying Storage download URL. Read data with
`get()` or proxy an authorized response from a Function.

## Project Scope and Keys

- Keys are relative paths. Reject absolute paths, backslashes, empty path
  segments, `.`, and `..`.
- Keys are isolated to the current project. Public results contain only the
  business key.
- Design key prefixes around an already authenticated tenant, user, or
  Conversation. A key is an identifier, not authorization.

## Browser Upload API

Issue an upload ticket only after authenticating the user and authorizing the
exact destination key:

```ts
import { blob } from "@iga-pages/blob";

// Called after the handler authenticates the user and authorizes this exact key.
export async function issueUploadTicket(
  authorizedKey: string,
  signal: AbortSignal,
) {
  return blob.createUploadUrl(authorizedKey, {
    onlyIfNew: true,
    abortSignal: signal,
  });
}
```

The ticket authorizes a temporary browser `PUT`. Its API does not accept a
custom expiry, bind a Content-Type, or enforce a maximum upload size. Do not
invent or pass unsupported options. Treat the URL as sensitive until it expires;
do not log it or allow callers to choose keys outside their authorized prefix.

## Error API

`BlobError` is directly constructible and exposes:

```ts
new BlobError(code, message, { status? })

error.code       // upstream Storage code/statusCode, or a local failure code
error.status     // optional actual HTTP response status
error.message
error.toJSON()   // { code, status?, message }; no stack
```

## Agent and Sandbox Artifacts

Sandbox files are ephemeral and may disappear when an instance expires or is
recreated. Persist files that must survive into Blob explicitly, and restore them
into a later Sandbox only after checking Conversation or resource ownership.
Read [file transfer](agent-sdk.md#file-transfer) for public transfer APIs and size
limits, and [Sandbox lifecycle](agent-sdk.md#sandbox-lifecycle-api) for identity
semantics.

The Blob SDK uses the platform data plane. Do not create or link a customer
Supabase integration merely to use Blob, and do not paste Supabase credentials
into project environment variables for it.

## Local Development and Runtime

Use Node.js 20 or newer and `iga pages dev`, with `@iga-pages/blob` as a direct
application dependency. The CLI supplies runtime identity for the linked project
and can associate an unlinked directory without deploying. Local operations use
that project's real object storage.

Do not configure project IDs, endpoints, or runtime tokens in business code.
`iga pages build` bundles Blob with Functions or SSR output without embedding
credentials; deployment supplies runtime identity. Static and browser-only
output must call an authorized server endpoint or use an upload ticket.

## Security

Never expose or log raw causes, Storage responses, upload tickets, runtime
credentials, authorization headers, or object contents that may contain secrets
or personal data. Validate object size and content type in application logic
where required; the current upload ticket does not enforce those limits.

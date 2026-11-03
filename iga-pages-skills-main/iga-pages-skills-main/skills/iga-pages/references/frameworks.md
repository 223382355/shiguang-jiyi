# Frameworks

IGA Pages detects a project's framework and selects a build path, but it does
not install or inject dependencies into the user project. A repository detection
rule also does not necessarily mean that the framework is enabled for users.

Use the package manager already selected by the project. Do not create a second
lockfile or replace unrelated framework configuration.

## Supported Frameworks and Build Paths

| Project type                                                                    | IGA Pages build path     | User-project integration          |
| ------------------------------------------------------------------------------- | ------------------------ | --------------------------------- |
| Next.js                                                                         | Built-in Next.js builder | No IGA adapter required           |
| Astro with static output                                                        | Static build             | Adapter optional                  |
| Astro with SSR or hybrid output                                                 | Astro adapter build      | `@iga-pages/astro` required       |
| Nuxt full-stack                                                                 | Nuxt module build        | `@iga-pages/nuxt` required        |
| Vite, Vue CLI, Create React App, Hexo, Angular, Docusaurus, VitePress, VuePress | Static build             | No IGA adapter required           |
| Plain HTML, JavaScript, and CSS                                                 | Static assets            | No framework integration required |

Frameworks outside this matrix are not currently supported.

## Astro

Supported Astro versions are 5, 6, and 7. Pure static Astro projects can deploy
without an adapter. Install the official adapter when the project uses SSR or
hybrid rendering, or relies on adapter-generated redirects or consistent routing
output:

```bash
npm install @iga-pages/astro
# or: pnpm add @iga-pages/astro
# or: yarn add @iga-pages/astro
```

Merge it into `astro.config.mjs` (or the project's existing Astro config):

```js
import { defineConfig } from "astro/config";
import igaAdapter from "@iga-pages/astro";

export default defineConfig({
  adapter: igaAdapter(),
});
```

Preserve the existing `output`, `integrations`, `base`, and other settings. Do
not change the rendering mode merely to install the adapter.

Astro 6 and 7 require Node.js 22.12 or newer. New CLI-created Astro projects use
Node 22 by default, but an existing project configured for Node 20 is not
automatically migrated; update its IGA Pages project setting before deploying.
Astro 5 may continue to use Node 20.

## Nuxt

Supported versions are Nuxt `^3.17.7` and `^4.0.0`. Full-stack Nuxt deployments
require the official module:

```bash
npm install @iga-pages/nuxt
# or: pnpm add @iga-pages/nuxt
# or: yarn add @iga-pages/nuxt
```

Add it to the existing `modules` array in `nuxt.config.ts` (or the project's
existing Nuxt config) without removing other modules:

```ts
export default defineNuxtConfig({
  modules: ["@iga-pages/nuxt"],
});
```

The module only changes production build output. Leave it configured during
local development: `nuxt dev`, `npm run dev`, and `iga pages dev` retain normal
Nuxt development behavior and do not write adapter output.

## Pre-deployment Check

1. Identify the actual framework and rendering mode.
2. If the selected build path requires an adapter or module, confirm that its
   package is declared and installed, then confirm that the framework config
   enables it. A dependency alone is insufficient.

Do not silently accept a generic static fallback for Astro SSR/hybrid or Nuxt
full-stack. It cannot preserve framework-specific SSR, server routes,
middleware, or adapter-generated routing configuration.

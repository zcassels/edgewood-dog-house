# Creating Backend Worker

API endpoints are served from the same Astro Cloudflare Worker as the marketing
site. The API is gated to the subdomain `api-prod1-cf.edgewooddoghouse.com` via
middleware; the apex serves static content only.

## Deploy

```sh
npm run deploy
```

First deploy auto-provisions the custom domain DNS record on the
`edgewooddoghouse.com` zone (requires `custom_domain: true` in `wrangler.json`).

Verify:

```sh
curl -i https://api-prod1-cf.edgewooddoghouse.com/api/health
curl -i https://edgewooddoghouse.com/api/health      # expect 404
curl -i https://api-prod1-cf.edgewooddoghouse.com/   # expect 404
```

Local dev (`/api/*` served on localhost):

```sh
npm run dev
curl -i http://localhost:4321/api/health
```

Logs:

```sh
wrangler tail
```

## Setup Steps

Steps followed to wire the API into the existing Astro project.

### 1. Add the API endpoint

`src/pages/api/health.ts` — must set `prerender = false` so the Cloudflare
adapter serves it dynamically.

```ts
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "content-type": "application/json" },
  });
};
```

### 2. Add hostname middleware

`src/middleware.ts` — restricts `/api/*` to the API subdomain and blocks the
subdomain from serving marketing pages.

```ts
import { defineMiddleware } from "astro:middleware";

const API_HOSTNAME = "api-prod1-cf.edgewooddoghouse.com";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const isApiPath = url.pathname.startsWith("/api/");
  const isApiHost = url.hostname === API_HOSTNAME;
  const isLocal = LOCAL_HOSTNAMES.has(url.hostname);

  if (isApiPath && !isApiHost && !isLocal) return new Response("Not Found", { status: 404 });
  if (!isApiPath && isApiHost) return new Response("Not Found", { status: 404 });
  return next();
});
```

### 3. Bind the custom domain in `wrangler.json`

```json
"routes": [
  { "pattern": "api-prod1-cf.edgewooddoghouse.com", "custom_domain": true }
]
```

### 4. Deploy

```sh
npm run deploy
```

## Adding More Endpoints

Drop files under `src/pages/api/`. Each file must export `prerender = false`
and one or more HTTP method handlers (`GET`, `POST`, etc.).

| File                            | URL                |
| ------------------------------- | ------------------ |
| `src/pages/api/health.ts`       | `/api/health`      |
| `src/pages/api/dogs.ts`         | `/api/dogs`        |
| `src/pages/api/dogs/[id].ts`    | `/api/dogs/:id`    |

The middleware applies automatically — no per-endpoint host check required.

import { defineMiddleware } from "astro:middleware";

const API_HOSTNAME = "api-prod1-cf.edgewooddoghouse.com";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const isApiPath = url.pathname.startsWith("/api/");
  const isApiHost = url.hostname === API_HOSTNAME;
  const isLocal = LOCAL_HOSTNAMES.has(url.hostname);

  if (isApiPath && !isApiHost && !isLocal) {
    return new Response("Not Found", { status: 404 });
  }

  if (!isApiPath && isApiHost) {
    return new Response("Not Found", { status: 404 });
  }

  return next();
});

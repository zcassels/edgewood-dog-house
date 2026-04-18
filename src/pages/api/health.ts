import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "edgewood-dog-house-api",
      env: "prod1-cf",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    },
  );
};

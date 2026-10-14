// Vercel function entry (F4 shape; the human deploys it, see DEPLOY.md). Vercel's Node runtime calls the default
// export with Node request/response objects, the same ones the local server uses. A live reading job keeps running
// after the 202 answer through Vercel's documented waitUntil (Stage 6, docs/sources/vercel-functions.md); its
// promises share the function's maxDuration, which the job budget fits (DEPLOYED_LIVE_BUDGET).
import { waitUntil } from "@vercel/functions";
import { createHandler } from "../src/web/app.js";

const handle = createHandler({ defer: (work) => waitUntil(work.catch(() => undefined)) });
export default function handler(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) {
  return handle(req, res);
}

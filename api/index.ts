// Vercel function entry (F4 shape; the human deploys it, see DEPLOY.md; live reading is off there, S3-24). Vercel's Node runtime
// calls the default export with Node request/response objects, the same ones the local server uses.
import { createHandler } from "../src/web/app.js";

const handle = createHandler();
export default function handler(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) {
  return handle(req, res);
}
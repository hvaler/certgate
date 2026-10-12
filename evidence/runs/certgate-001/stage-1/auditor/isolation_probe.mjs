// Auditor probe, run INSIDE the candidate image with --network none (mounted read-only at /probe).
// Starts the service on PORT, checks /health, then processes cases in one server process in the orders
// A->B, B->A and B alone, and compares B's decision-relevant receipt fields (register S1-36, A-13).
import { spawn } from "node:child_process";

const PORT = process.env.PORT ?? "4100";
const base = `http://127.0.0.1:${PORT}`;
const strip = (r) => JSON.stringify({ proposal: r.proposal, reasons: r.reasons, values: r.values, rule_results: r.rule_results,
  channel_checks: r.channel_checks, status: r.status, reading_source: r.reading_source });

async function waitUp() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`${base}/health`); if (r.ok) return await r.text(); } catch {}
    await new Promise((s) => setTimeout(s, 100));
  }
  throw new Error("service did not start");
}
async function proc(id) {
  const r = await fetch(`${base}/api/cases/${id}/process`, { method: "POST" });
  const body = await r.json();
  return body.receipt ?? body;
}
async function session(order) {
  const srv = spawn("node", ["dist/src/server.js"], { env: { ...process.env, PORT }, stdio: "ignore" });
  try {
    const health = await waitUp();
    const out = {};
    for (const id of order) out[id] = await proc(id);
    return { health, out };
  } finally { srv.kill(); await new Promise((s) => setTimeout(s, 200)); }
}

const A = process.argv[2] ?? "cg-003", B = process.argv[3] ?? "cg-001";
const ab = await session([A, B]);
const ba = await session([B, A]);
const bAlone = await session([B]);
const aAlone = await session([A]);
console.log("health:", ab.health);
const res = {
  B_after_A_equals_B_alone: strip(ab.out[B]) === strip(bAlone.out[B]),
  B_before_A_equals_B_alone: strip(ba.out[B]) === strip(bAlone.out[B]),
  A_after_B_equals_A_alone: strip(ba.out[A]) === strip(aAlone.out[A]),
  A_proposal: ab.out[A].proposal, B_proposal: ab.out[B].proposal,
};
console.log(JSON.stringify(res));
process.exit(Object.values(res).every((v) => v !== false) ? 0 : 1);

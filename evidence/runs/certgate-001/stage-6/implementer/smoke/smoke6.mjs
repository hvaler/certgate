// Stage 6 smoke test of the live job API against a running container (D6-02): one reading of sample cg-004,
// downloaded from the container's own sample route, polled every 2 s. Prints a summary with no secret: states and
// times, the model as reported, the endpoint response id, the proposal and the F1 snapshot state.
const base = process.argv[2] ?? "http://127.0.0.1:3100";
const t0 = Date.now();
const log = (o) => console.log(JSON.stringify({ t_s: ((Date.now() - t0) / 1000).toFixed(1), ...o }));
const status = await (await fetch(`${base}/api/live/status`)).json();
log({ step: "status", enabled: status.enabled, scope_note: status.scope_note, model_requested: status.model_requested, used_this_hour: status.used_this_hour });
const samples = await (await fetch(`${base}/api/samples`)).json();
const s = samples.samples.find((x) => x.id === "cg-004");
const pdf = Buffer.from(await (await fetch(base + s.certificate)).arrayBuffer());
const csv = await (await fetch(base + s.delivery_note)).text();
log({ step: "sample", id: s.id, bytes: pdf.length, sha256_listed: s.certificate_sha256 });
const res = await fetch(`${base}/api/live/jobs`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ certificate_base64: pdf.toString("base64"), delivery_csv: csv, delivery_line: s.delivery_line, synthetic_confirmed: true }),
});
const job = await res.json();
log({ step: "post", http: res.status, state: job.state, position: job.position, job_id: job.job_id });
let last = "";
for (;;) {
  const v = await (await fetch(`${base}${job.poll}`)).json();
  const line = `${v.state}${v.position ? ` pos ${v.position}` : ""}`;
  if (line !== last) { log({ step: "poll", state: v.state, position: v.position, elapsed_s: v.elapsed_s }); last = line; }
  if (v.state === "done") {
    const rc = v.result.view.receipt;
    log({ step: "done", reading_source: rc.reading_source, model_reported: rc.reader.model_id, model_requested: rc.reader.requested_model_id,
      response_id: rc.endpoint_response?.response_id, proposal: v.result.view.proposal, status: rc.status, f1_state: rc.f1?.state,
      f1_latency_ms: rc.f1?.last_reading?.elapsed_ms ?? null, cost_reported: rc.endpoint_response?.cost_reported, job_id: v.result.job_id, started_at: v.result.started_at, finished_at: v.result.finished_at });
    break;
  }
  if (v.state === "failed") { log({ step: "failed", reason_class: v.reason_class, reason: v.reason }); break; }
  await new Promise((r) => setTimeout(r, 2000));
}
const after = await (await fetch(`${base}/api/live/status`)).json();
log({ step: "status_after", used_this_hour: after.used_this_hour, in_flight: after.in_flight, remaining_this_hour: after.remaining_this_hour });

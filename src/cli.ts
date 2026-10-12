#!/usr/bin/env node
// CertGate command line.
//   certgate list
//   certgate process --case <id>                        a dataset case (data/cases/<id>)
//   certgate process --case-dir <dir> [--line <n>] [--delivery <csv>]
//   options: --out <file>  --receipt-only  --confirm <field>=<value|absent> (repeatable)  --confirmed-by <name>
//            --decide <release|block|request_new_certificate> --reason <text> --decided-by <name>
// Exit codes: 0 processed (any proposal, including reader errors), 2 input rejected, 1 internal error.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { CaseInputError, listDatasetCases, loadDatasetCase, loadExternalCase, loadShared } from "./cases.js";
import { getMode } from "./config.js";
import { InputRejected } from "./input-file.js";
import { DeliveryNoteError } from "./delivery.js";
import { ConfirmationError, HumanDecisionError, processCase, recordHumanDecision, type CaseResult } from "./pipeline.js";
import { exportReceipt } from "./receipt.js";
import type { FieldConfirmation, HumanAction } from "./types.js";

export const EXIT = { processed: 0, internal: 1, rejected: 2 } as const;

function parseArgs(argv: string[]) {
  const opts: Record<string, string[]> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const flag = key === "receipt-only";
      const v = flag ? "true" : argv[++i];
      if (v === undefined) throw new CaseInputError(`missing value for --${key}`);
      (opts[key] ??= []).push(v);
    } else positional.push(a);
  }
  return { opts, positional };
}

/** The note follows the actual reading source and mode (finding F-04). */
function readingNote(r: CaseResult): string {
  const base = "CertGate only proposes. A person decides. All data is fictitious.";
  switch (r.receipt.reading_source) {
    case "mock":
      return `${base} The reading is MOCK (no model).`;
    case "planted":
      return `${base} The reading is MOCK (no model) with planted deviations: ${r.receipt.planted.map((p) => p.kind).join(", ")}.`;
    case "live_no_reading":
      return `${base} Mode ${r.receipt.mode}: live attempt, no reading was obtained (${r.receipt.errors[0]?.class ?? "error"}); nothing was read by a model.`;
    case "live":
      return `${base} The reading came from the live endpoint, model ${r.receipt.reader.model_id} (as reported by the endpoint).`;
  }
}

export function summary(r: CaseResult) {
  return {
    case_id: r.readings.case.case_id,
    status: r.readings.case.status,
    proposal: r.decision.proposal,
    human_required: r.decision.human_required,
    reading_source: r.receipt.reading_source,
    reasons: r.decision.reasons.map((x) => x.code),
    human_confirmation_required: r.decision.human_confirmation_required,
    note: readingNote(r),
  };
}

export async function main(argv: string[], out: (s: string) => void = (s) => process.stdout.write(s)): Promise<number> {
  try {
    const { opts, positional } = parseArgs(argv);
    const cmd = positional[0];
    const one = (k: string) => opts[k]?.[opts[k]!.length - 1] ?? null;
    if (cmd === "list") {
      out(listDatasetCases().join("\n") + "\n");
      return EXIT.processed;
    }
    if (cmd !== "process") {
      out("usage: certgate list | certgate process --case <id> | --case-dir <dir> [--line <n>] [--delivery <csv>]\n");
      return EXIT.rejected;
    }
    const shared = loadShared(getMode());
    const input = one("case")
      ? loadDatasetCase(one("case")!, shared)
      : one("case-dir")
        ? loadExternalCase(one("case-dir")!, shared, { line: one("line"), delivery: one("delivery") })
        : null;
    if (!input) throw new CaseInputError("process needs --case <id> or --case-dir <dir>");
    const by = one("confirmed-by") ?? "";
    const confirmations: FieldConfirmation[] = (opts.confirm ?? []).map((c) => {
      const m = /^([\w.]+)=(.*)$/.exec(c);
      if (!m) throw new CaseInputError(`--confirm expects field=value, got ${c}`);
      return { field: m[1]!, value: m[2] === "absent" ? null : m[2]!, unit: null, confirmed_by: by, confirmed_at: new Date().toISOString() };
    });
    let result = await processCase(input, confirmations);
    const action = one("decide");
    if (action) {
      result = recordHumanDecision(result, {
        action: action as HumanAction, reason: one("reason") ?? "", decided_by: one("decided-by") ?? "", decided_at: new Date().toISOString(),
      });
    }
    const receipt = exportReceipt(result.receipt);
    const text = one("receipt-only") ? receipt : JSON.stringify({ summary: summary(result), receipt: JSON.parse(receipt) }, null, 2) + "\n";
    const file = one("out");
    if (file) writeFileSync(file, text);
    out(text);
    return EXIT.processed;
  } catch (e) {
    if (e instanceof InputRejected || e instanceof CaseInputError || e instanceof DeliveryNoteError ||
        e instanceof ConfirmationError || e instanceof HumanDecisionError) {
      out(JSON.stringify({ status: "rejected", code: (e as InputRejected).code ?? e.name, error: e.message }, null, 2) + "\n");
      return EXIT.rejected;
    }
    out(JSON.stringify({ status: "internal_error", error: (e as Error).message }, null, 2) + "\n");
    return EXIT.internal;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

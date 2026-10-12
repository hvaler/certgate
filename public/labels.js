// UI labels and release gating, kept apart from app.js so they are tested in node (test/labels.test.ts).
// Every label says what the reading really is (I7); release is offered only when the core proposes it (B-14).
"use strict";
(function (root) {
  const READING_TEXT = {
    mock: "mock reading · no model",
    planted: "mock reading · planted deviation",
    live: "live reading from the configured endpoint",
    live_no_reading: "live attempt · no reading",
  };

  /** Text for a receipt's reading_source; unknown sources are shown as they are, never upgraded to live. */
  function readingText(rc) {
    return READING_TEXT[rc.reading_source] || `unknown reading source: ${rc.reading_source}`;
  }

  /** A stored story: always its original stored time (the static file), plus a re-evaluation time if any (F2-01). */
  function storyLabelDetail(s) {
    return s.evaluatedAt
      ? `mock reading, no model · stored ${s.storedAt} · re-evaluated by the server at ${s.evaluatedAt} with the confirmations and decision given · not live`
      : `mock reading, no model · stored ${s.storedAt} · not live`;
  }

  /** A case kept in this browser: its reading label and its original receipt time; never "live" (B-09). */
  function localLabelDetail(view) {
    return `${view.reading_label} · ${view.receipt.created_at} · not live`;
  }

  /** Release is offered only when the current proposal is release (S2-04, B-14). */
  function releaseAllowed(view) {
    return !!view && view.proposal === "release" && view.status !== "error";
  }

  root.CertGateLabels = { readingText, storyLabelDetail, localLabelDetail, releaseAllowed };
})(typeof window !== "undefined" ? window : globalThis);

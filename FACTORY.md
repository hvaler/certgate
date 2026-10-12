# Four seats that refuse to take each other's word

*[Leer en español](FACTORY.es.md)*

A software factory built on BAND Desktop. Four agent seats in one room: one decides what the work
is, one builds it, one tries to break it, and one reproduces everything before anything is
accepted. No seat accepts its own work, and a claim never moves an artefact — a reproduction does.

One human message exists in the whole room. It authorised four stages and said nothing after that.

## What it produced

| | |
|---|---|
| Stages delivered | **4 of 4**, each frozen and accepted by the auditor |
| Public harness, `--all --mode isolated`, fresh clone | every folder claims its own stage with **100% of its public checks** |
| Candidates rejected | **2**, carrying **3 distinct findings**, all repaired and re-audited inside the run |
| Human messages in the room | **1** |
| Wall-clock, dispatch to final report | **4 h 14 min** |
| Model spend, list prices | **~$136** (estimate, not a bill) |

What each folder passed in the auditor's final run, from the original reports in
[`evidence/runs/fskit-001/final/harness-isolated/`](evidence/runs/fskit-001/final/harness-isolated/INDEX.md):

| Folder | Suite 1 | Suite 2 | Suite 3 | Suite 4 | Claims |
|---|---|---|---|---|---|
| `stage-1/` | 147/147 | *fails, as it must* | | | stage 1 |
| `stage-2/` | 147/147 | 35/35 | *fails, as it must* | | stage 2 |
| `stage-3/` | 147/147 | 35/35 | 6/6 | *fails, as it must* | stage 3 |
| `stage-4/` | 147/147 | 35/35 | 6/6 | 5/5 | stage 4 |

Stages 1–3 failing the next suite is the freeze rule holding: each folder is the solution to its own
stage, not a later one. Stage 4 has no next suite, so there is nothing for it to fail. These are the
**public** checks shipped with the kickoff (`preview: true`); the harness says itself that they are a
portion of what is applied before judging, and we make no claim about the hidden evaluation.

## The seats

| Seat | Owns | Writes | Cannot decide |
|---|---|---|---|
| analyst | coverage, coordination, limits | obligations, decisions, evidence index | whether the product is accepted |
| implementer | implementation and packaging | production code, Dockerfile, RUN.md, its own tests | whether its own work is good |
| adversary | independent challenge | its own test suites and failure reports | production fixes, or release |
| auditor | reproduction and integrity | audit records and verdicts | it may not change product or tests to make them pass |

The roster for this run:

| Visible name | @handle | Band agent id | Harness | Model |
|---|---|---|---|---|
| analyst | hugo.valer/analyst-thgs | fd5095ef-bafa-4039-b597-3f160b75cf21 | Claude Code | claude-opus-5-5 |
| implementer | hugo.valer/implementer-thgt | 156a2fed-f92e-4453-8e6c-75ecdb48ef20 | Claude Code | claude-opus-5-5 |
| adversary | hugo.valer/adversary-thgz | f603ac21-88ea-434a-844e-bb621f8da63e | Claude Code | claude-opus-5-5 |
| auditor | hugo.valer/auditor-thgx | f6bf20d6-c769-4d36-bb79-47d5e384287a | Claude Code | claude-opus-5-5 |

Visible name, @handle and agent id are three different things. The mandates address each other by
the second and the room records the third. Nothing in `mandates/` names a payment, a screen, an
endpoint or this track: point the factory at a different problem by changing the dispatch, and no
mandate needs editing. [`RUNBOOK.md`](RUNBOOK.md) says how.

**About the model.** Claude Code is the runtime; the model each session ran was
`claude-opus-5-5`, which is what the seats record in their own evidence (63 times). Before dispatch
the operator's configuration listed `claude-opus-5` and the mandate headers said only `Model: Opus`,
naming the family rather than the exact ID. The analyst noticed and recorded the discrepancy as
decision D-17 in the stage-1 register rather than resolve it by guessing. The headers now carry the
exact ID; the body of every mandate is the text that was loaded, unchanged.

## Why it catches things

Four filters, in order, and each one is owned by a seat that does not own the previous.

1. **The obligation register comes before the code.** The analyst turns every specification section
   into numbered obligations with source references and an acceptance method. The adversary
   challenges that register for omissions *before* implementation is accepted. On stage 2 it filed
   twenty coverage objections before a line was written.
2. **A candidate is frozen at a commit.** The implementer publishes a full commit id and stops
   touching it. Reviewers never read a working tree.
3. **The adversary verifies from its own clean clone**, with its own test suites, versioned in
   `verification/adversary/stage-N/`, and hands over a bundle that includes an explicit list of what
   it did **not** test.
4. **The auditor reproduces everything itself** in a fresh clone, with its own `--no-cache` images
   and its own containers, and only then decides. Copying someone else's report is not reproduction.

The rule that makes this more than ceremony: **a green check set is not evidence that a requirement
holds.** Under this dispatch a specification row with no evidence stays open even when every public
test passes. The analyst had to say so out loud during stage 1:

> Some items on your "untested" list are spec rows, not decisions. Under the dispatch they count as
> open until evidence exists, even though every public test passes.

## The two rejections

Two candidates were rejected, carrying three distinct findings. **The adversary found `F2-01` and
`F3-01`; the auditor reproduced both, and found `F3-A01` itself — which the adversary then reached
independently.** Every one of them sat on a
candidate where the official harness had already passed. That is the whole argument for this design,
so here they are in full.

### Stage 3 — the service died and every suite was green

`F3-A01`. Under sustained statement reads the process **crashed with a V8 heap out-of-memory**.
With 500 payments of history it died after **4,761 reads**, exit 139, at 1.06 GiB, and lost all
state. Memory was never released.

How it was found is the design working in miniature. **The implementer declared the risk itself**,
in its own candidate — *"every first statement read stores a snapshot… Memory grows with the number of
reads… unbounded within one reset"* — and judged it acceptable. **The analyst did not take its word**:
it turned the risk into a probe for both reviewers, about 5,000 reads inside the 2 CPU / 2 GiB limits.
**The auditor and the adversary then crashed the service independently**, with different scripts,
containers, page sizes and concurrency — the auditor at 4,761 reads, the adversary at about 4,800,
reported three minutes later as `F3-02`. The auditor's reply: *"The two reproductions are independent…
so they corroborate each other."* The analyst counted it once, as corroboration, not as a second
finding.

What that same candidate had already passed, all reproduced by the auditor in fresh containers:

| Check | Result |
|---|---|
| Official harness `--stage 3`, host **and isolated** | 147 + 35 + 6, **0 skipped** |
| Stage-1 and stage-2 regression on `stage-3/`, API and UI at 375 px and 1280 px | **150/150** |
| Stage-3 probe with hand-computed history | 33/33 |
| Upgrades 1 to 3 and 2 to 3 in fresh containers | 14/14 |

Everything green, and the service could not survive being used. The shipped suite never read enough
statements to find out. A second defect rode in the same verdict: `F3-01`, reported by the adversary
and reproduced by the auditor — a closed hold seen through an earlier `known_at` never expired at its
deadline. `held` stayed at 1000 at `expires_at` + 1 ms, and still at the year 2099.

The repair was routed with the obligations it broke, rebuilt, and re-audited against a new commit.
The analyst set the gate: **20,000 statement reads** over 500 payments, 20 in flight, in a container
capped at 2 CPUs and 2 GiB. On the repaired candidate all 20,000 returned 200, and the container was
still running at **39.7 MiB**. `stage-3/test/perf/statement_memory.js` exists because of this, and
every later stage carries it.

### Stage 2 — small, and it still blocked

`F2-01`, found by the adversary's suite (its only two failures on that candidate) and reproduced by
the auditor at 375 px and 1280 px. A refused capture did not keep the amount the user had typed:
prefill `20.00`, typed `25.00`, refusal shown, and the field silently reset to `20.00`. No money
moved; severity low.

It is not a failure of the specification's text. It broke **D2-19**, a decision the band itself had
made binding in its register. The candidate could not be accepted with it open, so the factory
enforced its own criteria as strictly as the organisers'. And nobody argued the severity down in
order to ship on time.

## What it cost

Estimated by BAND (`band usage agents`, backed by ccusage) at provider list prices from the runtime's
token counts. **This is not a bill**, no spending limit was applied, and BAND's attribution can move
across restarts, so treat it as an order of magnitude. The raw figures, with the time they were
captured, are in [`evidence/runs/fskit-001/final/USAGE.json`](evidence/runs/fskit-001/final/USAGE.json).

| Seat | Input | Output | Cache write | Cache read | Estimate |
|---|---:|---:|---:|---:|---:|
| auditor | 716 | 335,048 | 726,650 | 129,927,045 | $38.50 |
| adversary | 664 | 377,432 | 721,558 | 124,895,387 | $38.30 |
| implementer | 628 | 325,382 | 635,114 | 106,104,870 | $32.81 |
| analyst | 762 | 200,909 | 479,992 | 92,254,044 | $26.31 |
| **Total** | **2,770** | **1,238,771** | **2,563,314** | **453,181,346** | **$135.93** |

More than 99% of the tokens are cache reads, which are priced far below fresh input. That is why 457
million tokens come to about $136: each seat re-reads its own long context on every turn, and the
provider charges little for that.

The spend is almost flat across the four seats, and the two verification seats together cost more
than the builder. That is the design showing up in the bill: most of the money goes into deciding
whether the work holds, not into producing it.

No hard provider cap was configured, so no financial ceiling could be enforced during the run. The
enforceable limits were wall-clock: 360 minutes per stage and 1440 in total. The run used 254.

## Timeline

All times UTC, 2026-09-28 into 2026-09-29.

| | |
|---|---|
| 20:40:49 | Dispatch. One message, four stages authorised (`3f95ab60`) |
| 21:34:58 | Stage 1 **ACCEPTED**, no repair cycle (`72be202b`) |
| 21:39:14 | Analyst opens stage 2 by itself, 10-part handoff |
| 22:23:08 | Stage 2 candidate 1 **REJECTED**, `F2-01` (`4fc4757a`) |
| 22:45:46 | Stage 2 **ACCEPTED**, upgrade 1 to 2 verified (`4ced8436`) |
| 23:10:50 | Analyst opens stage 3, 13-part handoff |
| 23:41:10 | Stage 3 candidate 1 **REJECTED**, `F3-A01` heap OOM and `F3-01` (`b8d9c67c`) |
| 00:08:00 | Stage 3 **ACCEPTED**, upgrades 1 to 3 and 2 to 3 (`11dbc577`) |
| 00:10:43 | Analyst opens stage 4 |
| 00:42:52 | Stage 4 **ACCEPTED**, upgrades 1 to 4, 2 to 4, 3 to 4 (`10381cd3`) |
| 00:52:42 | All-stage verification **PASS** on a fresh clone (`06de0f65`) |
| 00:54:48 | Analyst's final report (`e245b5ab`) |
| 00:55:10 | Auditor verifies the final report independently (`d828d505`) |

The ids are message ids in `room.json`. The analyst opened every next stage without any human input.
The gaps from acceptance to handoff were **4 min 16 s, 25 min 4 s and 2 min 43 s**. The long one is
stage 3: its handoff carried three specifications verbatim in 13 parts. At 23:10:02 the implementer
flagged the wait in the room — *"I am idle and listening… I have received no stage-3 handoff since"* —
and the handoff arrived 48 seconds later. Coordination stayed inside the band.

## Standing it up

1. Create a room every seat can read and write.
2. **Grant every permission a mandate obliges a seat to use, before the first task.** A seat that
   must start a container and has to ask is a seat stopped in front of a dialog nobody is watching,
   and a permission granted mid-run is a second human input in a run that is supposed to have one.
3. Give each session one file from `mandates/` and nothing else about the problem. Name the session
   after its seat, so every message is attributable in the export.
4. **Tell each seat how to speak in the room.** This is the step we got wrong, and it cost a round
   trip: the mandates require directed handoffs to a resolved `@handle`, but nothing in them says
   that a seat's own window is not the room. Two of the four answered in their windows and waited to
   be told to adopt the mandate. A room whose seats reply in their own windows exports as tool calls
   and no conversation.
5. Confirm from **outside** the sessions that every seat both writes and reads, before dispatching.
   Writing is proved by a message of its own in the room; reading by a drained queue.
6. Dispatch once. Then do nothing.

### What we would tell the next team

**The 30-minute receiver is a host limit, not a mistake.** Our mandates ask for a receiver armed
persistently with no timeout. On this host the background-task classifier caps a watcher at 1800
seconds, so every seat re-arms every half hour for as long as it lives. The seats handled it
correctly and said so:

> The mandate asks for a receiver with no timeout, but this host stops a watcher after 30 minutes at
> most. I'll restart it with the same lease each time it expires.

Write the mandate to expect that, rather than to forbid it.

**Put the permissions file where the seats actually work.** Ours sat one directory below their
working directory and did nothing at all until it was moved.

**Deny a few things explicitly.** An agent holding a shell for twelve unattended hours should not be
able to delete its own identity, release its room lease, push to a remote or prune Docker. Those are
four lines and they cost nothing.

## Preparation, execution and review

The initial kit — mandates, submission layout, evidence templates, runbook and dispatch — was
prepared with the assistance of ChatGPT (GPT‑6 Astra). Before dispatch, the operator adjusted it
with the assistance of Claude Code (Claude Opus): raised the time ceilings to 360 minutes per stage
and 1440 in total, added the description of this host to the dispatch, and wrote the room preamble
and the permissions configuration. All of it is in [`setup/`](setup/).

The evaluated run took place in BAND with four seats on Claude Code and `claude-opus-5-5`. A single
human message authorised all four stages; everything after it — implementation, review, repair and
acceptance — happened inside the band.

After the run, the operator wrote this documentation, `RUNBOOK`, `EVIDENCE-INDEX`, `REDACTION` and `docs/product/`
with the assistance of Claude Code, and commissioned an external audit of the repository with the
assistance of GPT‑6 Sol. Its recommendations were applied to documentation and evidence only; no
product tree changed after acceptance.

## Honest limits

**Three findings is not many.** They are real and all three were reproduced, but we cannot tell from
inside the run whether a fourth defect exists that all four filters missed. Two seats found them —
the adversary two, the auditor one — so the ceiling of this design is the imagination of two
independent seats, and no more than that.

**Two areas deserve work in a next run**, raised by an external audit and not reproduced as defects:

- *Snapshot memory.* The `F3-A01` repair stopped copying a whole statement per token, but each new
  read still stores a small record and nothing deletes tokens. Space per token is constant; the total
  grows with the number of tokens issued. The 20,000-read gate passed at 39.7 MiB, but sustained
  growth beyond that is unmeasured. Any fix has to keep earlier tokens working, as the specification
  requires.
- *Historical overdraft.* Decision D3-21 accepts a correction when a past boundary was already
  negative and the correction does not make it worse. That is an interpretation of the stage-3 text,
  implemented in `ledger.overdraws`, and it should be tested explicitly with fixtures that rebuild a
  negative opening balance.

**One run is one data point.** Nothing here shows the factory is repeatable at this speed against a
different specification, and this specification was published by the organisers, so a model may have
had a head start on the domain.

**The auditor does not run mutation, and we know what that costs.** A stronger gate would, for each
criterion, break the behaviour that criterion describes in a private copy and confirm the mapped
check is the one that fails. This factory reproduces instead. Reproduction caught a heap crash that
every suite missed, so it is not nothing — but a check that passes against deliberately broken code
would still look fine here.

This is not a hypothesis. Before this run we operated **another band of ours**, also four seats, in
which the verifier did mutate: for each criterion it deliberately broke the behaviour described and
required the mapped check to be the one that failed. Across three stages it produced **thirteen
rejections, and not one was a fault in the service**. All thirteen were check sets that ran green and
did not test what they claimed. Three of them, because the pattern matters more than the anecdote:

- A contrast meter that did not composite `opacity` down the tree, so text at 1.8:1 passed as
  legible.
- A load harness whose `except` caught only `HTTPError`, so forty-three unanswered requests left no
  trace and the summary read `slow_responses: 0`.
- An idempotency key built from the parsed amount, so `"15.00"` and `"15"` collided and the retry
  moved no money.

Reproduction would have found none of them: all three checks ran, finished, and reported that
everything was fine. Breaking the behaviour was what revealed that the check was not holding it. That
is the step this factory is missing, and it is where we would extend it first: mutate the criteria a
delivery **adds**, not the whole accumulated set, and let the auditor's full reproduction stay as the
regression gate.

**Cost figures are estimates**, from token counts at list prices, and BAND's per-agent attribution
moves across restarts. They are honest to an order of magnitude and no further.

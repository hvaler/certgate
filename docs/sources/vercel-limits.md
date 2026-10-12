# Vercel function limits (register S2-22)

Recorded **before** the model adapter call path was written. Values are quoted from Vercel's documentation as
retrieved, **not from memory**.

## Sources

| Page | URL | Retrieved (UTC) | Page `dateModified` | SHA-256 of the HTML as retrieved |
|---|---|---|---|---|
| Vercel Functions Limits | https://vercel.com/docs/functions/limitations | 2026-10-12T18:16:42Z | 2026-08-24T14:00:33.000Z | `5f3c831b2d41480fb536fd6a10a26e6cfd06982f8f908bb423969a3be2830f42` |
| Configuring Maximum Duration for Vercel Functions | https://vercel.com/docs/functions/configuring-functions/duration | 2026-10-12T18:16:42Z | 2026-08-24T14:00:33.000Z | `1aeabfa299b3e92c72d8b2240d631f4abb2d248c330fcb5bec2ffbb6f1e93d25` |

Retrieved by implementer-xwz4 with `Invoke-WebRequest`. The HTML was not committed (it is about 1 MB of site
chrome); the quotes below are verbatim from the text of those pages.

## Quotes

Function maximum duration (Limits page, "Max duration"):

> With fluid compute enabled, Vercel Functions have the following defaults and maximum limits:
> Default Maximum Extended maximum Hobby 300s (5 minutes) 300s (5 minutes) - Pro 300s (5 minutes) 800s
> 1800s (30 minutes) Beta Enterprise 300s (5 minutes) 800s 1800s (30 minutes) Beta

> If a function runs for longer than its set maximum duration, Vercel will terminate it.
> (Duration page)

Request body size (Limits page, "Request body size"):

> The maximum payload size for the request body or the response body of a Vercel Function is 4.5 MB. If a
> Vercel Function receives a payload in excess of the limit it will return an error 413:
> FUNCTION_PAYLOAD_TOO_LARGE.

## Values CertGate designs for

| Limit | Value used | Why |
|---|---|---|
| Function duration | **300 s** (Hobby default and maximum, also the Pro default) | the lowest plan's ceiling; no plan-specific setting needed |
| Request and response body | **4.5 MB** | same on every plan |

## Design decisions (src/web/limits.ts)

1. **Upload size.** The browser sends the certificate as base64 inside JSON, which inflates it by 4/3. The upload
   limit is therefore **3 MiB of PDF** (3 MiB × 4/3 = 4 MiB of base64, plus the delivery CSV of at most 256 KiB,
   below 4.5 MB). The server rejects larger bodies with 413 before parsing them. The Stage 1 CLI limit of 10 MiB
   still applies to local files only.
2. **Duration.** A live reading is one request: the adapter has a per-attempt timeout of **60 s** and at most 2
   retries (3 attempts), so the worst case is 180 s plus backoff, which stays below 300 s. **Start-then-poll is
   not used** in this dispatch, because a reading within these bounds fits one invocation and a stateless backend
   has nowhere to keep a job between polls. If dispatch 2 measures readings that need more than the 180 s budget,
   it must switch to start-then-poll with a managed store (open item OI-S2-02).
3. **Responses.** A case result with its receipt is well under 1 MB, so it fits the response limit too.
4. **State.** Functions keep no case data. Stored stories are versioned static files. New cases live in the
   visitor's browser (localStorage). The live-read counter is the only server state (D2-06), held in memory per
   instance in this dispatch; a multi-instance deployment needs a shared store (open item OI-S2-01).

Nothing is deployed in this dispatch (S2-23).

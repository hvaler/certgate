# Auditor check of the Vercel limits record (S2-22), certgate-001 stage 2

Fetched by auditor-xwz6 with Invoke-WebRequest (the HTML is not committed: third-party site content).

| URL | Retrieved UTC | HTTP | dateModified | SHA-256 of HTML as fetched by auditor |
|---|---|---|---|---|
| https://vercel.com/docs/functions/limitations | 2026-10-12T18:57:50Z | 200 | 2026-08-24T14:00:33.000Z | 66df2d875730614e02c66457800e402dd16fbf70f8909fb1c0d99949afaa7a7b |
| https://vercel.com/docs/functions/configuring-functions/duration | 2026-10-12T18:57:51Z | 200 | 2026-08-24T14:00:33.000Z | 68c933aefc421a4a181dd41922bf9323b39a8ce92a9ebd2286a948219b50e739 |

Text checks on the de-tagged page text:
- limitations: contains "4.5 MB" = True; "FUNCTION_PAYLOAD_TOO_LARGE" = True; "300s (5 minutes)" = True; "800s" = True.
  Context: "maximum payload size for the request body or the response body of a Vercel Function is 4.5 MB . If a Vercel Function receives a payload in excess of the limit it will return an error 413: FUNCTION_PAYLOAD_TOO_LARGE"
- duration: contains "300s (5 minutes)" = True; "800s" = True; "Vercel will terminate it" = True.

Result: the values and quotes in docs/sources/vercel-limits.md (commit e96d29ce) match the live pages; dateModified matches the
record. The HTML hashes differ from the implementer's (dynamic page chrome), which is expected and not a finding.

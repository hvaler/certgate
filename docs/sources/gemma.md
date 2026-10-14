# The comparison model, Gemma-4-31B-IT (Stage 5)

Recorded from the publisher's own page, not from memory. Gemma-4-31B-IT is used only for the comparison run in
METRICS.md; the product reads with Qwen3.8-27B ([model.md](model.md)).

| Item | Value | Source |
|---|---|---|
| Model requested (`MODEL_ID`, set only in the environment of the evaluation command) | `Gemma-4-31B-IT` | dispatch 3 configuration |
| Model as reported by the endpoint | `self-dploy/Gemma-4-31B-IT` (the `model` field of every chat reply) | `evaluation/runs/real-gemma-04100b9/results.json` |
| Publisher | Google (Hugging Face organization "google"); the card names the authors as Google DeepMind ("License: Apache 2.0 \| Authors: Google DeepMind") | https://huggingface.co/google/gemma-4-31b-it |
| Licence, as published by the publisher | `apache-2.0` (model card metadata "license: apache-2.0", with "license_link: https://ai.google.dev/gemma/docs/gemma_4_license") | https://huggingface.co/google/gemma-4-31b-it, retrieved 2026-10-14 |
| Input used here | page images (model card metadata "pipeline_tag: image-text-to-text") | same page |
| Served by | AMD Token Factory, the same endpoint as the product model (host recorded in the evaluation artifacts) | dispatch 3 |

Facts reported by the human, not observed by the band: on 2026-10-13 Gemma-4-31B-IT on AMD Token Factory returned
degenerate output; on 2026-10-14 between 10:27 and 10:31 UTC the human re-tested it and it answered correctly
(dispatch 3).

Not exposed by the endpoint, and therefore not claimed: the GPU model, the ROCm version and the serving-stack
version.

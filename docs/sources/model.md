# The model that reads the certificates (S3-21)

Recorded from the publisher's own page, not from memory.

| Item | Value | Source |
|---|---|---|
| Model requested (`MODEL_ID`) | `Qwen3.8-27B` | dispatch 2 configuration (changes only if the human changes it) |
| Model as reported by the endpoint | `self-dploy/Qwen3.8-27B` (the `model` field of every chat reply) | evaluation artifacts, receipts |
| Publisher | Qwen Team (Hugging Face organization "Qwen") | https://huggingface.co/Qwen/Qwen3.8-27B — citation block |
| Licence, as published by the publisher | `apache-2.0` ("License: apache-2.0" in the model card metadata) | https://huggingface.co/Qwen/Qwen3.8-27B, retrieved 2026-10-13 |
| Input used here | page images ("Image-Text-to-Text"; the card describes it as "a native vision-language model that understands images and videos") | same page |
| Served by | AMD Token Factory (OpenAI-compatible endpoint; host recorded in the evaluation artifacts) | dispatch 2; event page notebooks.amd.com/tokenfactory |

Not exposed by the endpoint, and therefore not claimed anywhere in this product: the GPU model, the ROCm
version and the vLLM (or other serving) version. The product model is not Gemma; the Gemma-4-31B-IT comparison run
is recorded in [gemma.md](gemma.md). No prize
claim of any kind is made.

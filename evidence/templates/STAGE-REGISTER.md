# Registro de etapas — PLANTILLA

Run: PENDIENTE · Objetivo: 4 · Dispatch único: PENDIENTE · Fuente/commit: PENDIENTE.

| Stage | Estado | Commit candidato | Árbol de stage-N | Decisión auditor | Specs/suites | Reporte isolated | Upgrades reproducidos | Tiempo / uso | Checkpoint room |
|---|---|---|---|---|---|---|---|---|---|
| 1 | NOT_STARTED | | | | 1 | | Mismo stage | | |
| 2 | NOT_STARTED | | | | 1–2 | | 1→2 | | |
| 3 | NOT_STARTED | | | | 1–3 | | 1→3, 2→3 | | |
| 4 | NOT_STARTED | | | | 1–4 | | 1→4, 2→4, 3→4 | | |

Estados: NOT_STARTED, ACTIVE, REJECTED, BLOCKED, ACCEPTED, INVALIDATED. No borrar decisiones anteriores; enlazar eventos sucesivos. ACCEPTED exige veredicto real del auditor. El objetivo no es un resultado.

## Cierre global

- Commit y clone verificados:
- Comando --all --mode isolated y salida nueva:
- Claims públicos por carpeta y logs:
- Mayor prefijo contiguo interno aceptado:
- Mayor prefijo contiguo reclamado en checks públicos:
- Evidencia de cada RUN.md y UI aplicable:
- Upgrades: referencias y árboles sin cambios, o nuevas reproducciones:
- Árboles aceptados iguales a los publicados:
- Medición total de tiempo/uso/coste y limitaciones:
- Resultado terminal: NOT_RUN / FOUR_STAGES_VERIFIED / PARTIAL / BLOCKED.
- Informe final de analyst y mensajes reales:

FOUR_STAGES_VERIFIED representa la verificación interna documentada. La evaluación oficial sigue siendo desconocida hasta el resultado del organizador.

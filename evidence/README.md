# Evidence Ledger

El ledger es una secuencia de eventos inmutables, no una tabla que se sobrescribe para esconder fallos. Está vacío hasta que se ejecuten acciones reales. Las plantillas bajo `templates/` no son evidencia.

## Escritura

Cada seat crea un archivo por evento en `runs/<run-id>/stage-N/events/<event-id>.json`, bajo el permiso de escritura coordinado. Usa un ID único con secuencia, seat y timestamp. Se puede derivar `ledger.jsonl` concatenando eventos por secuencia; no editar a mano la historia resultante. STAGE-REGISTER reúne los cuatro checkpoints y UPGRADE-REPORT documenta cada par de migración. La evidencia de cierre global va en `runs/<run-id>/final/`.

Un evento identifica: run, stage, obligación y sección de spec, actor real, tipo de acción, candidato completo, revisión de test, entorno, comando exacto, entradas reproducibles, salida y artefactos con SHA-256. Añade IDs reales de mensajes solo cuando existen. Si un ID no está disponible todavía, deja null y crea después un evento LINK que lo enlace; no inventes el ID ni cambies el evento original.

## Estados

`OPEN -> CLAIMED -> CHALLENGED -> REPRODUCED -> ACCEPTED`

También se puede pasar a `REJECTED` o `BLOCKED`. Una reparación crea nuevos eventos en otra revisión, enlazados con `supersedes_event_id`; no borra el rechazo anterior. Solo auditor escribe ACCEPTED. Analyst comunica el resultado, sin sustituir ese veredicto. Un FAIL reproducido puede tener `reproduced: true`; reproducción no significa éxito.

Los pasos describen evidencia por obligación. La aceptación del stage exige la cobertura completa y un veredicto separado que enumere obligaciones, comprobaciones y pendientes. No basta con una única fila verde.

## Integridad

- El hash completo del candidato apunta al código que se ejecutó, nunca simplemente al HEAD más reciente.
- Los tests independientes tienen su propia revisión. Si se ejecutan desde otro checkout, registrar ambos caminos y revisiones.
- `evidence_commit` puede ser null al crear el evento; la revisión que lo contiene se publica en la room o en un evento posterior, evitando hashes autorreferentes.
- Registrar comandos, directorio de trabajo, versiones, modo de aislamiento, semillas, concurrencia, inicio/fin UTC, exit code y conteos observados.
- El auditor crea logs nuevos. Un enlace a logs de adversary no es reproducción independiente.
- Preservar cada report.json y logs fallidos; cada salida del harness utiliza un directorio nuevo.
- No guardar credenciales reales, tokens, exports privados o volcados sensibles en el repo público. Usar entradas sintéticas reproducibles y logs diseñados para no exponer secretos. Un hash por sí solo sin artefacto reproducible no prueba un resultado.
- No afirmar éxito sobre tests ocultos ni confundir el resultado del probe de siguiente stage con los requisitos del actual.

## Ejemplo de recorrido (conceptual, no resultado)

CLAIM en revisión A -> challenge encuentra un fallo -> auditor lo reproduce y rechaza A -> reparación en B -> adversary repite -> auditor reproduce en B -> ACCEPTED para B. El repositorio conservaría ambos candidatos y todos los eventos; no se generan filas de ejemplo que parezcan reales.

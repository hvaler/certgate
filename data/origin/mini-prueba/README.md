# Mini prueba de lectura · datos ficticios

**Todo es inventado**: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., la calidad TRN-355 y la
especificación ESP-014. Los límites no son los de ninguna norma real. Cada certificado lo dice en el pie. Son
datos de demo, permitidos antes del kickoff (`CLAUDE.md`, restricción 4); no son código del producto.

Sirve para la prueba descrita en `docs/02-IDEA.md` («Mini prueba para desempatar»): ver si el modelo abierto
servido con vLLM en AMD lee bien un certificado digital, uno escaneado y uno escaneado ambiguo.

| Fichero | Qué es | Propuesta esperada |
|---|---|---|
| `cert-01-digital-conforme.pdf` | PDF con capa de texto; todos los valores dentro | `release` (decide Calidad) |
| `cert-02-escaneado-fuera-especificacion.pdf` | Solo imagen, ligeramente girado; Mn 1,68 > 1,60 y CEV 0,46 > 0,45 | `block` |
| `cert-03-escaneado-ambiguo.pdf` | Solo imagen, girado 2,4°; el segundo dígito del ReH está manchado (358 o 338) | `review` |
| `especificacion-ESP-014.json` | Límites y reglas de documento de la empresa ficticia | — |
| `albaran-ALB-2026-0917.csv` | Las tres partidas con su colada (las tres coinciden) | — |
| `esperado.json` | Valores verdaderos de cada campo y propuesta esperada, **escritos antes de pasar el modelo** | — |
| `generar.py` | Regenera todo: `python generar.py` (reportlab y Pillow) | — |

## Cómo se mide

1. Pasar cada certificado por el modelo candidato con la misma instrucción: devolver JSON con colada, calidad,
   composición, CEV, ReH, Rm, A, KV y sello, con `null` en lo que no se lea con seguridad.
2. Comparar campo a campo con `verdad` de `esperado.json`. Anotar: aciertos, errores y **valores inventados**
   (un valor seguro donde debía haber `null`), que es lo grave.
3. En el certificado 3, lo correcto es devolver `null` o señalar duda en el ReH. Leer «358» con seguridad es
   acertar por suerte; leer «338» con seguridad es un error.
4. Anotar latencia y coste por certificado (gate A4 de `docs/02-VALIDACION-DE-ACCESO.md`).

La lectura del resultado (CertGate confirmado, ajustar el relato del escaneado o replantear) está en
`docs/02-IDEA.md`.

El CEV usa la fórmula del IIW, `C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15`. Hay que **citar una fuente** en el
repositorio antes de usarla en el producto.

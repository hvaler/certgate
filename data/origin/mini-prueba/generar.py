"""Genera los datos ficticios de la mini prueba de lectura (CertGate).

Datos de demostración: empresa, fabricante, calidad TRN-355 y especificación ESP-014 son inventados y no
corresponden a ninguna norma ni empresa real. No es código del producto.

Uso: python generar.py   (necesita reportlab y Pillow; fuentes Arial de Windows)
"""
import json
import random
from decimal import Decimal
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

AQUI = Path(__file__).parent
W, H = A4  # puntos
FUENTES = {False: "C:/Windows/Fonts/arial.ttf", True: "C:/Windows/Fonts/arialbd.ttf"}
AVISO = "DOCUMENTO FICTICIO - DATOS DE DEMOSTRACIÓN (AMD ACT III / CertGate). No corresponde a ningún material real."

ESPEC = json.loads((AQUI / "especificacion-ESP-014.json").read_text(encoding="utf-8"))

CERTS = [
    {
        "fichero": "cert-01-digital-conforme.pdf", "modo": "digital",
        "numero": "SV-2026-118204", "fecha": "2026-09-14", "colada": "24-71830", "partida": 1,
        "dim": "Chapa 20 x 2000 x 6000 mm", "piezas": 12, "masa": "22 608 kg",
        "quimica": {"C": "0.16", "Si": "0.21", "Mn": "1.42", "P": "0.012", "S": "0.006", "Cr": "0.04",
                    "Ni": "0.03", "Mo": "0.01", "Cu": "0.05", "V": "0.002"},
        "ReH": "392", "Rm": "538", "A": "26", "KV": ["64", "71", "58"],
    },
    {
        "fichero": "cert-02-escaneado-fuera-especificacion.pdf", "modo": "escaneado", "giro": 0.6,
        "numero": "SV-2026-118377", "fecha": "2026-09-16", "colada": "24-71902", "partida": 2,
        "dim": "Chapa 15 x 2000 x 6000 mm", "piezas": 16, "masa": "22 608 kg",
        "quimica": {"C": "0.17", "Si": "0.24", "Mn": "1.68", "P": "0.014", "S": "0.008", "Cr": "0.03",
                    "Ni": "0.02", "Mo": "0.01", "Cu": "0.06", "V": "0.003"},
        "ReH": "401", "Rm": "556", "A": "24", "KV": ["52", "48", "55"],
    },
    {
        "fichero": "cert-03-escaneado-ambiguo.pdf", "modo": "escaneado", "giro": -2.4, "mancha": "ReH",
        "numero": "SV-2026-118512", "fecha": "2026-09-19", "colada": "24-72015", "partida": 3,
        "dim": "Chapa 25 x 2000 x 6000 mm", "piezas": 10, "masa": "23 550 kg",
        "quimica": {"C": "0.15", "Si": "0.19", "Mn": "1.38", "P": "0.011", "S": "0.005", "Cr": "0.05",
                    "Ni": "0.04", "Mo": "0.01", "Cu": "0.07", "V": "0.002"},
        "ReH": "358", "Rm": "529", "A": "27", "KV": ["61", "57", "66"],
    },
]


def cev(q):
    """Carbono equivalente, fórmula del IIW: C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15. Verificar con fuente citada."""
    d = {k: Decimal(v) for k, v in q.items()}
    return d["C"] + d["Mn"] / 6 + (d["Cr"] + d["Mo"] + d["V"]) / 5 + (d["Ni"] + d["Cu"]) / 15


def maqueta(c):
    """Lista de primitivas con origen arriba a la izquierda, en puntos."""
    p = []
    t = lambda x, y, s, tam=9, neg=False, id=None: p.append(("t", x, y, s, tam, neg, id))
    l = lambda x1, y1, x2, y2, g=0.8: p.append(("l", x1, y1, x2, y2, g))
    t(40, 50, "SIDERÚRGICA VALDEMORA S.A.", 15, True)
    t(40, 66, "Polígono Industrial Las Arenas, parcela 7 · 39000 Valdemora (ficticio)", 8)
    t(330, 50, "CERTIFICADO DE INSPECCIÓN 3.1", 12, True)
    t(330, 66, "Inspection certificate type 3.1 according to EN 10204", 8)
    l(40, 78, 555, 78, 1.2)
    filas = [("Nº certificado / Certificate no.", c["numero"]), ("Fecha / Date", c["fecha"]),
             ("Cliente / Customer", "Talleres Ribera Norte S.L."), ("Pedido cliente / Customer PO", "PC-2026-0412"),
             ("Producto / Product", c["dim"]), ("Calidad / Grade", "TRN-355 según especificación cliente ESP-014 rev. 3"),
             ("Colada / Heat no.", c["colada"]), ("Piezas / Pieces", str(c["piezas"])), ("Masa / Weight", c["masa"])]
    y = 98
    for k, v in filas:
        t(40, y, k, 8)
        t(220, y, v, 9, True, "colada" if k.startswith("Colada") else None)
        y += 15
    y += 8
    t(40, y, "ANÁLISIS QUÍMICO DE COLADA (% en masa) / HEAT ANALYSIS (wt %)", 9, True)
    y += 8
    l(40, y, 555, y)
    elems = list(c["quimica"].keys()) + ["CEV"]
    valores = list(c["quimica"].values()) + [str(cev(c["quimica"]).quantize(Decimal("0.01")))]
    ancho = 515 / len(elems)
    for i, (e, v) in enumerate(zip(elems, valores)):
        t(46 + i * ancho, y + 16, e, 9, True)
        t(46 + i * ancho, y + 34, v, 9, False, "q_" + e)
    l(40, y + 22, 555, y + 22, 0.5)
    l(40, y + 42, 555, y + 42)
    t(40, y + 56, "CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15", 7)
    y += 80
    t(40, y, "ENSAYOS MECÁNICOS / MECHANICAL TESTS (transversal, temperatura ambiente)", 9, True)
    y += 8
    l(40, y, 555, y)
    cab = [("ReH (MPa)", c["ReH"], "ReH"), ("Rm (MPa)", c["Rm"], "Rm"), ("A (%)", c["A"], "A")]
    for i, (k, v, id) in enumerate(cab):
        t(46 + i * 130, y + 16, k, 9, True)
        t(46 + i * 130, y + 34, v, 9, False, id)
    l(40, y + 22, 555, y + 22, 0.5)
    l(40, y + 42, 555, y + 42)
    y += 66
    t(40, y, "ENSAYO DE FLEXIÓN POR CHOQUE / IMPACT TEST  KV, -20 °C (J)", 9, True)
    y += 8
    l(40, y, 555, y)
    for i, (k, v) in enumerate(zip(["Probeta 1", "Probeta 2", "Probeta 3", "Media / Average"],
                                   c["KV"] + [str(round(sum(int(x) for x in c["KV"]) / 3))])):
        t(46 + i * 130, y + 16, k, 9, True)
        t(46 + i * 130, y + 34, v, 9, False)
    l(40, y + 22, 555, y + 22, 0.5)
    l(40, y + 42, 555, y + 42)
    y += 70
    t(40, y, "Certificamos que el material suministrado cumple el pedido y la especificación indicada.", 8)
    t(40, y + 12, "We hereby certify that the material supplied complies with the order and the stated specification.", 8)
    t(330, y + 50, "Departamento de Calidad · Inspector autorizado", 8)
    t(330, y + 64, "Firmado: M. Ortega (ficticio)   Sello: QA-07", 9, True)
    p.append(("r", 470, y + 80, 540, y + 120))
    t(482, y + 104, "QA-07", 11, True)
    t(40, 810, AVISO, 6.5)
    return p


def pdf_digital(c, ruta):
    cv = canvas.Canvas(str(ruta), pagesize=A4)
    cv.setTitle(f"Certificado {c['numero']} (ficticio)")
    for prim in maqueta(c):
        if prim[0] == "t":
            _, x, y, s, tam, neg, _id = prim
            cv.setFont("Helvetica-Bold" if neg else "Helvetica", tam)
            cv.drawString(x, H - y, s)
        elif prim[0] == "l":
            _, x1, y1, x2, y2, g = prim
            cv.setLineWidth(g)
            cv.line(x1, H - y1, x2, H - y2)
        else:
            _, x1, y1, x2, y2 = prim
            cv.rect(x1, H - y2, x2 - x1, y2 - y1)
    cv.save()


def pdf_escaneado(c, ruta, dpi=170):
    k = dpi / 72
    img = Image.new("L", (int(W * k), int(H * k)), 255)
    d = ImageDraw.Draw(img)
    cajas = {}
    for prim in maqueta(c):
        if prim[0] == "t":
            _, x, y, s, tam, neg, id = prim
            f = ImageFont.truetype(FUENTES[neg], int(tam * k))
            pos = (x * k, (y - tam) * k)
            d.text(pos, s, font=f, fill=25)
            if id:
                cajas[id] = (pos, s, f)
        elif prim[0] == "l":
            _, x1, y1, x2, y2, g = prim
            d.line([(x1 * k, y1 * k), (x2 * k, y2 * k)], fill=40, width=max(1, int(g * k)))
        else:
            _, x1, y1, x2, y2 = prim
            d.rectangle([x1 * k, y1 * k, x2 * k, y2 * k], outline=40, width=2)
    if c.get("mancha"):
        (px, py), s, f = cajas[c["mancha"]]
        x0 = px + f.getlength(s[0])        # el segundo dígito
        x1 = px + f.getlength(s[:2])
        alto = f.size * 1.15
        # Borra la parte alta del dígito (lo que distingue un 5 de un 3) y deja una mancha encima.
        ImageDraw.Draw(img).rectangle([x0, py + alto * 0.12, x0 + (x1 - x0) * 0.5, py + alto * 0.55], fill=250)
        capa = Image.new("L", img.size, 0)
        ImageDraw.Draw(capa).ellipse([x0 - 4, py, x1 + 2, py + alto * 0.75], fill=200)
        capa = capa.filter(ImageFilter.GaussianBlur(5))
        gris = Image.new("L", img.size, 150)
        img = Image.composite(gris, img, capa)
    rnd = random.Random(c["numero"])
    ruido = Image.effect_noise(img.size, 18)
    img = Image.blend(img, ruido, 0.08)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img = img.rotate(c.get("giro", 0) + rnd.uniform(-0.1, 0.1), resample=Image.BICUBIC, expand=False, fillcolor=245)
    img.convert("RGB").save(ruta, "PDF", resolution=dpi, quality=70)


def esperado(c):
    q = {k: Decimal(v) for k, v in c["quimica"].items()}
    valor_cev = cev(c["quimica"]).quantize(Decimal("0.01"))
    lim = ESPEC["limites"]
    fallos = []
    for campo, regla in lim.items():
        if campo == "CEV":
            v = valor_cev
        elif campo == "KV_media":
            v = Decimal(sum(int(x) for x in c["KV"])) / 3
        elif campo in q:
            v = q[campo]
        else:
            v = Decimal(c[campo])
        if "max" in regla and v > Decimal(regla["max"]):
            fallos.append({"campo": campo, "observado": str(v), "max": regla["max"]})
        if "min" in regla and v < Decimal(regla["min"]):
            fallos.append({"campo": campo, "observado": str(v), "min": regla["min"]})
    if c.get("mancha"):
        propuesta, motivo = "review", f"{c['mancha']} ilegible (segundo dígito manchado): podría leerse 338 (< 355, fuera) o 358 (dentro). Confirmación humana."
    elif fallos:
        propuesta, motivo = "block", "Fuera de especificación ESP-014: " + ", ".join(f["campo"] for f in fallos)
    else:
        propuesta, motivo = "release", "Todos los valores dentro de ESP-014; colada coincide con el albarán. Decide Calidad."
    return {
        "fichero": c["fichero"], "modo": c["modo"], "capa_de_texto": c["modo"] == "digital",
        "verdad": {"numero": c["numero"], "fecha": c["fecha"], "colada": c["colada"], "calidad": "TRN-355",
                   "producto": c["dim"], "quimica": c["quimica"], "CEV_impreso": str(valor_cev),
                   "ReH": c["ReH"], "Rm": c["Rm"], "A": c["A"], "KV": c["KV"], "sello": "QA-07"},
        "colada_coincide_albaran": True,
        "fallos_especificacion": fallos,
        "propuesta_esperada": propuesta,
        "motivo": motivo,
        "notas": {"digital": "Dos canales disponibles (capa de texto y modelo).",
                  "escaneado": "Sin capa de texto: campos críticos con confirmación humana."}[c["modo"]],
    }


def main():
    resultados = []
    for c in CERTS:
        ruta = AQUI / c["fichero"]
        (pdf_digital if c["modo"] == "digital" else pdf_escaneado)(c, ruta)
        resultados.append(esperado(c))
    (AQUI / "esperado.json").write_text(json.dumps(resultados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for r in resultados:
        print(r["fichero"], "->", r["propuesta_esperada"], [f["campo"] for f in r["fallos_especificacion"]])


if __name__ == "__main__":
    main()

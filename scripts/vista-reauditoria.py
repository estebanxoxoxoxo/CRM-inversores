# -*- coding: utf-8 -*-
"""Vista compacta para re-auditar a mano: python scripts/vista-reauditoria.py <inicio> <fin>"""
import json, glob, os, sys, re
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = sorted(glob.glob(os.path.join(raiz, "data", "perfiles", "*.json")))
a, b = int(sys.argv[1]), int(sys.argv[2])
def j(v, n=None):
    if isinstance(v, list): v = " || ".join(str(x) for x in v)
    v = re.sub(r"\s+", " ", str(v or "")).strip()
    return v if n is None else v[:n]
for i, f in enumerate(files[a:b], a):
    d = json.load(open(f, encoding="utf-8"))
    au = d.get("auditoria", {})
    print(f"\n#{i} [{d['id']}] {d['nombre']} | {d['region']} | {d['tipo_inversor']} | v1: nivel {d.get('nivel')} prio {d.get('prioridad')} conf {d.get('confianza')}")
    print(f"  ROL: {j(d['rol'], 150)} @ {j(d['firma'], 60)}")
    print(f"  MOTIVO v1: {j(au.get('motivo'))}")
    print(f"  ETAPA: {j(d['etapa_y_ticket'])}")
    print(f"  POR QUÉ: {j(d['por_que_es_interesante'])}")
    print(f"  TESIS: {j(d['tesis_de_inversion'])}")
print(f"\n{len(files)} perfiles")

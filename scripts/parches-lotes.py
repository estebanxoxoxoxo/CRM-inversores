# -*- coding: utf-8 -*-
"""Reescribe en términos absolutos los superlativos relativos al conjunto que quedaron en data/auditoria_v2/lote*.json.
Idempotente. Uso: python scripts/parches-lotes.py"""
import json, os, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA = os.path.join(RAIZ, "data", "auditoria_v2")

PARCHES = [
 ("adeyemi-ajao", "por_que", "el vínculo hispanohablante más verificable de la lista.", "vínculo hispanohablante plenamente verificable."),
 ("alfonso-subiotto-marques", "motivo", "y el evaluador técnico más cualificado del lote;", "y un evaluador técnico de primer nivel;"),
 ("diego-oppenheimer", "motivo", "El mejor encaje del conjunto: hispanohablante nativo,", "Encaje completo en todas las dimensiones: hispanohablante nativo,"),
 ("guillermo-rauch", "motivo", "El inversor hispanohablante con mejor encaje temático del mundo (Supabase", "Encaje temático máximo (Supabase"),
 ("javier-redondo", "motivo", "Nadie en la lista entiende mejor el producto: gestionó", "Entiende el producto desde dentro: gestionó"),
 ("juan-revuelta", "por_que", "precedente casi inédito en el VC español", "precedente poco frecuente en el VC español"),
 ("martin-gontovnikas", "motivo", "La persona hispanohablante mejor conectada del mundo dev tools (Vercel", "Muy bien conectado en el ecosistema dev tools (Vercel"),
 ("marc-clemente", "motivo", "La puerta pre-seed más institucional de España para una startup sin tracción:", "Una puerta pre-seed institucional en España para una startup sin tracción:"),
 ("oscar-salazar", "motivo", "La evidencia más limpia de apuesta deep tech pre-tracción del lote: puso", "Evidencia limpia de apuesta deep tech pre-tracción: puso"),
 ("patricia-pastor", "motivo", "El encaje más literal de España: único fondo 100% IA B2B con licencia CNMV,", "Encaje literal: fondo español dedicado 100% a IA B2B con licencia CNMV,"),
 ("miguel-del-canizo", "motivo", "La doctrina escrita de Bullnet es la más cercana a lo que busca el cliente", "La doctrina escrita de Bullnet coincide con lo que busca el cliente"),
 ("pep-martorell", "motivo", "El inversor español con más credenciales para auditar un claim de rendimiento (dirigió", "Credenciales sobradas para auditar un claim de rendimiento (dirigió"),
 ("rafa-de-haro", "motivo", "Único fondo mexicano con la frase 'Cometa invests in AI readiness enablers'", "Fondo mexicano con la frase 'Cometa invests in AI readiness enablers'"),
 ("sergio-alvarez-leiva", "motivo", "El único de la lista que ha construido y sigue construyendo la categoría del cliente", "Ha construido y sigue construyendo la categoría del cliente"),
 ("santiago-zavala", "motivo", "Programador en activo cuya conversación pública es la más cercana al producto:", "Programador en activo cuya conversación pública está pegada al producto:"),
 ("sebastien-lefebvre", "motivo", "La cartera de Elaia es probablemente la más parecida de Europa al producto del cliente (", "La cartera de Elaia es muy parecida al producto del cliente ("),
 ("martin-casado", "motivo", "La cartera más solapada con el cliente (consejero", "Cartera muy solapada con el cliente (consejero"),
 ("gonzalo-martinez-de-azagra", "motivo", "Único GP español cuyo fondo declara 'Developer Tools' por escrito", "GP español cuyo fondo declara 'Developer Tools' por escrito"),
 ("javier-ulecia", "motivo", "Único inversor español con un exit consumado en dev tools puros", "Exit consumado en dev tools puros"),
 ("patricia-pastor", "por_que", "Ángulo: en español desde Valencia, por la puerta de BrainGrid/Optiak", "Ángulo: en español desde Valencia, por la puerta de BrainGrid/Optiak"),
]

def reemplazar(v, viejo, nuevo):
    if isinstance(v, str):
        return v.replace(viejo, nuevo), v.count(viejo)
    if isinstance(v, list):
        out, n = [], 0
        for x in v:
            y, k = reemplazar(x, viejo, nuevo); out.append(y); n += k
        return out, n
    return v, 0

archivos = {f: json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob(os.path.join(CARPETA, "lote*.json")))}
aplicados, avisos = 0, []
for id_, campo, viejo, nuevo in PARCHES:
    if viejo == nuevo:
        continue
    hecho = False
    for f, d in archivos.items():
        if id_ in d and campo in d[id_]:
            valor, n = reemplazar(d[id_][campo], viejo, nuevo)
            if n:
                d[id_][campo] = valor; hecho = True; aplicados += n
    if not hecho:
        ya = any(id_ in d and campo in d[id_] and nuevo in json.dumps(d[id_][campo], ensure_ascii=False) for d in archivos.values())
        if not ya:
            avisos.append(f"{id_}.{campo}: no se encontró el texto")
for f, d in archivos.items():
    with open(f, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(d, fh, ensure_ascii=False, indent=1); fh.write("\n")
print(f"lotes: {aplicados} reemplazos; {len(avisos)} avisos")
for a in avisos:
    print("  -", a)

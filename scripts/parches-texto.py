# -*- coding: utf-8 -*-
"""Elimina comparaciones relativas al conjunto ("de la lista", "del lote", "de los seis"...) en los textos de los agentes.
Se aplica a data/perfiles/*.json y a los JSON de origen (Benchmark) para que no vuelvan al reimportar.
Uso: python scripts/parches-texto.py  (idempotente; informa de los parches que no encuentran su texto)."""
import json, os, sys, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "..", "Benchmark", "tools", "inversores", "perfiles_json")
DESTINOS = [os.path.join(RAIZ, "data", "perfiles"), ORIGEN]

PARCHES = [
 ("adrian-mendoza", "como_llegar", "Es de los fondos más accesibles de la lista sin intro.", "Es un fondo accesible sin intro."),
 ("alberto-yepez", "investigacion_larga", "Es, junto a Ade Ajao, el más conectado del lote con el mundo en español, pero", "Está muy conectado con el mundo en español, pero"),
 ("alejandro-guerrero", "investigacion_larga", "es el contacto con mayor probabilidad de conversión real de este lote.", "es un contacto con alta probabilidad de conversión real."),
 ("ana-carolina-mexia-ponce", "investigacion_larga", "la inversora más cercana al cliente de este lote mexicano;", "una inversora mexicana muy cercana al cliente;"),
 ("andres-saborido", "investigacion_larga", "Mantenerlo en la lista como contacto de ecosistema", "Mantenerlo como contacto de ecosistema"),
 ("bernardo-hernandez", "investigacion_larga", "La forma correcta de usarlo en la lista es como contacto", "La forma correcta de usarlo es como contacto"),
 ("carles-reina", "riesgos_o_alertas", "Su encaje en la lista de 'España' es por idioma", "Su clasificación en la región 'España' es por idioma"),
 ("carlos-gonzalez-cadenas", "investigacion_larga", "Es la conexión con España más directa de los seis.", "Su conexión con España es directa."),
 ("cristobal-valenzuela", "riesgos_o_alertas", "no incluirlo en la lista de outreach de inversión;", "no tratarlo como objetivo de outreach de inversión;"),
 ("cristobal-valenzuela", "como_llegar", "una intro entre ambos perfiles de este lote es plausible", "una intro a través de Rauch es plausible"),
 ("daniel-porras-reyes", "investigacion_larga", "lo convierte en la puerta de entrada más eficiente del lote, aunque no en el decisor.", "lo convierte en una puerta de entrada muy eficiente, aunque no en el decisor."),
 ("diana-hu", "investigacion_larga", "Es, con diferencia, el vehículo más claramente pre-tracción de este lote.", "Es un vehículo inequívocamente pre-tracción."),
 ("diana-hu", "senales_de_encaje", "la barrera de acceso más baja de toda la lista", "una barrera de acceso muy baja"),
 ("gabriel-vasquez", "como_llegar", "es el mejor gancho documentado de toda la lista.", "es un gancho documentado y explícito."),
 ("guillermo-rauch", "investigacion_larga", "Es el caso más claro de la lista: entrevistas y podcasts", "Es un caso claro: entrevistas y podcasts"),
 ("javier-redondo", "riesgos_o_alertas", "menos superficie de contacto informal que otros perfiles de la lista", "poca superficie de contacto informal"),
 ("juan-benet", "investigacion_larga", "es el inversor de la lista con el horizonte temporal más largo y la mayor tolerancia", "es un inversor con horizonte temporal muy largo y alta tolerancia"),
 ("juan-benet", "investigacion_larga", "merece estar en la lista por su horizonte", "merece seguimiento por su horizonte"),
 ("juan-revuelta", "inversiones_relevantes", "la inversión más relevante de todo el lote español en dev tools puros de alto rendimiento", "una inversión en dev tools puros de alto rendimiento, poco frecuente en el VC español"),
 ("leo-casusol", "investigacion_larga", "es de las más profundas de toda la lista.", "es muy profunda."),
 ("marco-mascorro", "como_llegar", "Es la vía más limpia del lote y admite escribir en español.", "Es una vía limpia y admite escribir en español."),
 ("martin-casado", "investigacion_larga", "que puede usarse para encadenar el outreach de este lote.", "que puede usarse para encadenar el outreach."),
 ("martin-casado", "investigacion_larga", "Es el único de la lista que probablemente pedirá ver el benchmark antes que el pitch", "Probablemente pedirá ver el benchmark antes que el pitch"),
 ("matias-woloski", "investigacion_larga", "Matías Woloski es, de las seis personas del lote, la que mejor encarna la tesis", "Matías Woloski encarna la tesis"),
 ("matias-woloski", "investigacion_larga", "Es la persona del lote con la que un equipo hispanohablante puede tener", "Es una persona con la que un equipo hispanohablante puede tener"),
 ("matias-woloski", "inversiones_relevantes", "la inversión más relevante del lote entero:", "una inversión muy relevante:"),
 ("miguel-del-canizo", "investigacion_larga", "Es el perfil de la lista con el discurso más alineado con", "Su discurso está alineado con"),
 ("oscar-salazar", "investigacion_larga", "es, con Xavier Amatriain, el perfil más técnicamente credencializado del lote y, con Matías Woloski, el que tiene la evidencia más concreta", "tiene credenciales técnicas de primer nivel y evidencia concreta"),
 ("rafa-de-haro", "investigacion_larga", "pero no es el primero de la lista y no conviene esperar", "pero no es prioritario y no conviene esperar"),
 ("rocio-pillado", "investigacion_larga", "es la senal de pre-traccion mas explicita que he encontrado en toda la lista.", "es una senal de pre-traccion muy explicita."),
 ("santi-subotovsky", "senales_de_encaje", "el caso Zoom es el argumento más fuerte de todo el lote frente a inversores que piden tracción", "el caso Zoom es un argumento fuerte frente a inversores que piden tracción"),
 ("tomas-barreto", "senales_de_encaje", "Es el único perfil de este lote que ha construido y vendido", "Ha construido y vendido"),
 ("vanessa-larco", "investigacion_larga", "El encaje de mandato es el mejor de los seis: etapa exacta", "El encaje de mandato es completo: etapa exacta"),
 ("vanessa-larco", "investigacion_larga", "Es, de los seis perfiles, quien más superficie pública tiene ahora mismo", "Tiene mucha superficie pública ahora mismo"),
 ("xavier-amatriain", "investigacion_larga", "Xavier Amatriain es, de los seis perfiles del lote, el que tiene el pensamiento público más cercano a la tesis", "Xavier Amatriain tiene un pensamiento público muy cercano a la tesis"),
 ("cristobal-valenzuela", "investigacion_larga", "moverlo fuera de la lista de outreach de inversión", "no tratarlo como objetivo de outreach de inversión"),
 ("alfonso-subiotto-marques", "auditoria", "puerta al fondo, único contacto de Lorimer en la lista.", "puerta al fondo."),
]

def reemplazar(valor, viejo, nuevo):
    """Reemplaza en strings, listas y dicts anidados. Devuelve (nuevo_valor, n_reemplazos)."""
    if isinstance(valor, str):
        n = valor.count(viejo)
        return (valor.replace(viejo, nuevo), n)
    if isinstance(valor, list):
        total = 0; out = []
        for x in valor:
            y, n = reemplazar(x, viejo, nuevo); out.append(y); total += n
        return (out, total)
    if isinstance(valor, dict):
        total = 0; out = {}
        for k, x in valor.items():
            y, n = reemplazar(x, viejo, nuevo); out[k] = y; total += n
        return (out, total)
    return (valor, 0)

for destino in DESTINOS:
    if not os.path.isdir(destino):
        print(f"(no existe {destino}, se omite)"); continue
    aplicados = 0; faltantes = []
    for id_, campo, viejo, nuevo in PARCHES:
        ruta = os.path.join(destino, f"{id_}.json")
        if not os.path.exists(ruta):
            faltantes.append(f"{id_}: archivo no encontrado"); continue
        with open(ruta, encoding="utf-8-sig") as f:
            d = json.load(f)
        # el campo puede llamarse con ñ en los JSON de origen
        claves = [campo] + (["señales_de_encaje"] if campo == "senales_de_encaje" else [])
        hecho = False
        for k in claves:
            if k in d:
                nuevo_valor, n = reemplazar(d[k], viejo, nuevo)
                if n:
                    d[k] = nuevo_valor; hecho = True; aplicados += n
        if hecho:
            with open(ruta, "w", encoding="utf-8", newline="\n") as f:
                json.dump(d, f, ensure_ascii=False, indent=2); f.write("\n")
        else:
            # ya aplicado (idempotente) o texto distinto
            with open(ruta, encoding="utf-8-sig") as f:
                txt = f.read()
            if nuevo not in txt:
                faltantes.append(f"{id_}.{campo}: no se encontró el texto a reemplazar")
    print(f"{destino}: {aplicados} reemplazos aplicados; {len(faltantes)} avisos")
    for x in faltantes: print("  -", x)

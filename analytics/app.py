"""
Dashboard · Sistema de Alerta de Riesgo de Incendios
Amazonia - Orinoquia · Colombia · 2026

Nota de datos: todo lo que es PRONÓSTICO (6 meses hacia adelante) proviene
única y exclusivamente de `predicciones_riesgo_6_meses.json` (generado por
prediccion_datos.py). El CSV histórico de puntos de calor solo se usa aquí
como referencia "hacia atrás" (promedios históricos para dar contexto),
nunca para generar ni ajustar predicciones.
"""

import json
import re

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ─── Configuración de página ────────────────────────────────────────────────
st.set_page_config(
    page_title="Alerta de Riesgo · Colombia",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── CSS ─────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }

    /* Ajuste de tipografía y espaciado */
    h1 { font-size: 1.55rem !important; font-weight: 600 !important; }
    h2 { font-size: 1.15rem !important; font-weight: 600 !important; }
    h3 { font-size: 1rem !important; font-weight: 600 !important; }

    /* Badges de riesgo en tablas */
    .badge-alto  { background:#fde8e8; color:#9b1c1c; padding:2px 10px; border-radius:12px; font-size:0.82rem; font-weight:600; }
    .badge-medio { background:#fef3c7; color:#92400e; padding:2px 10px; border-radius:12px; font-size:0.82rem; font-weight:600; }
    .badge-bajo  { background:#d1fae5; color:#065f46; padding:2px 10px; border-radius:12px; font-size:0.82rem; font-weight:600; }

    /* Tarjetas KPI */
    [data-testid="stMetric"] {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.75rem 1rem;
    }
    [data-testid="stMetricValue"] { font-size: 1.5rem !important; }
</style>
""", unsafe_allow_html=True)

# ─── Paleta de colores ────────────────────────────────────────────────────────
COLOR_DISC = {"bajo": "#22c55e", "medio": "#f59e0b", "alto": "#ef4444"}
COLOMBIA_CENTER = {"lat": 4.0, "lon": -73.5}

MESES_ES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}

# Nombres legibles de las variables que usa el modelo (para el gráfico de
# importancia). mes_sin / mes_cos son la misma señal (ciclo estacional)
# expresada en dos números matemáticos, por eso se fusionan en el gráfico.
FRIENDLY_VARS = {
    "lag_12":         "Lo que pasó hace exactamente un año (mismo mes)",
    "lag_1":          "Lo que pasó el mes pasado",
    "lag_2":          "Lo que pasó hace 2 meses",
    "lag_3":          "Lo que pasó hace 3 meses",
    "lag_6":          "Lo que pasó hace medio año",
    "media_movil_3":  "Promedio del último trimestre",
    "media_movil_6":  "Promedio del último semestre",
    "media_movil_12": "Promedio de los últimos 12 meses",
    "mes":            "El mes del año (estacionalidad)",
    "mes_sin":        "Ciclo estacional del calendario",
    "mes_cos":        "Ciclo estacional del calendario",
    "anio":           "El año (tendencia de largo plazo)",
    "dept_code":      "Cuál departamento es",
}

CSV_HISTORICO = "data/puntos_calor_por_semana_mes_con_coordenadas.csv"


def parse_umbral_dept(meta, departamento):
    """Extrae los umbrales numéricos (p33, p66) de un departamento a partir
    de los textos 'umbrales_riesgo' del JSON (ej. '≤5', '>5 y ≤41', '>41')."""
    thresholds = meta.get("umbrales_riesgo", {}).get(departamento, {})
    bajo_nums = re.findall(r"\d+\.?\d*", thresholds.get("bajo", ""))
    alto_nums = re.findall(r"\d+\.?\d*", thresholds.get("alto", ""))
    p33 = float(bajo_nums[0]) if bajo_nums else None
    p66 = float(alto_nums[0]) if alto_nums else None
    return p33, p66


def frase_umbral(riesgo, total, p33, p66):
    """Construye una frase de contexto: cuántos focos se esperan y cómo se
    comparan contra la escala de riesgo propia de ese departamento."""
    if riesgo == "sin datos":
        return "No hay predicción disponible para este departamento."
    if riesgo == "alto" and p66 is not None:
        detalle = f"supera el umbral alto de este departamento (> {p66:,.0f})"
    elif riesgo == "medio" and p33 is not None and p66 is not None:
        detalle = f"dentro del rango de riesgo medio de este departamento (> {p33:,.0f} y ≤ {p66:,.0f})"
    elif riesgo == "bajo" and p33 is not None:
        detalle = f"dentro del rango de riesgo bajo de este departamento (≤ {p33:,.0f})"
    else:
        detalle = f"nivel de riesgo: {riesgo}"
    return f"{total:,.0f} focos estimados · {detalle}"


def aciertos_de_10(accuracy):
    """Convierte un accuracy (0-1) en una frase 'X de cada 10 meses',
    más fácil de leer que un porcentaje técnico."""
    return int(round(accuracy * 10))


# ─── Carga de datos (cacheada) ────────────────────────────────────────────────
@st.cache_data
def load_data():
    with open("data/predicciones.json", encoding="utf-8") as f:
        raw = json.load(f)
    with open("data/colombia.geojson", encoding="utf-8") as f:
        geojson = json.load(f)

    # ── Predicciones (SIEMPRE desde el JSON: es la única fuente de "futuro") ──
    df = pd.DataFrame(raw["predicciones_proximos_6_meses"])
    df["nombre_mes"] = df["mes"].map(MESES_ES)
    df["etiqueta"]   = df.apply(lambda r: f"{r['nombre_mes']} {r['anio']}", axis=1)
    df["orden_riesgo"] = df["riesgo_predicho"].map({"bajo": 1, "medio": 2, "alto": 3})

    # ── Coordenadas históricas asociadas a meses de alto riesgo ──────────────
    rows = []
    for entry in raw["puntos_alto_riesgo"]:
        for lon, lat in entry["coordenadas"]:
            rows.append({
                "departamento":       entry["departamento"],
                "mes":                entry["mes"],
                "nombre_mes":         MESES_ES[entry["mes"]],
                "anio_prediccion":    entry["anio_prediccion"],
                "anios_considerados": entry.get("anios_considerados", ""),
                "longitud":           lon,
                "latitud":            lat,
            })
    df_coords = pd.DataFrame(rows) if rows else pd.DataFrame(
        columns=["departamento", "mes", "nombre_mes", "anio_prediccion",
                 "anios_considerados", "longitud", "latitud"]
    )

    meta = raw["metadata"]

    # ── Promedios históricos (SOLO para contexto "hacia atrás", nunca para
    #    generar predicciones) a partir del CSV crudo de puntos de calor ──────
    try:
        df_hist = pd.read_csv("data/puntos_calor_por_semana_mes_con_coordenadas.csv", usecols=["anio", "mes", "departamento", "conteo_puntos"])
        hist_mensual = (
            df_hist.groupby(["anio", "mes", "departamento"])["conteo_puntos"]
            .sum()
            .reset_index()
        )
        # Promedio histórico por (mes calendario, departamento), a través de todos los años
        avg_mes_depto = (
            hist_mensual.groupby(["mes", "departamento"])["conteo_puntos"]
            .mean()
            .reset_index()
            .rename(columns={"conteo_puntos": "promedio_historico"})
        )
        # Promedio histórico regional total por mes calendario (suma de deptos por año, promedio entre años)
        avg_region_mes = (
            hist_mensual.groupby(["anio", "mes"])["conteo_puntos"]
            .sum()
            .reset_index()
            .groupby("mes")["conteo_puntos"]
            .mean()
        )
    except FileNotFoundError:
        avg_mes_depto = pd.DataFrame(columns=["mes", "departamento", "promedio_historico"])
        avg_region_mes = pd.Series(dtype=float)

    return df, df_coords, geojson, meta, avg_mes_depto, avg_region_mes


df_pred, df_coords, geojson, meta, avg_mes_depto, avg_region_mes = load_data()
mr = meta.get("metricas_regresion", {})
mc = meta.get("metricas_clasificacion_riesgo", {})

# ══════════════════════════════════════════════════════════════════════════════
# PORTADA · Contextualización del problema
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("## 🔥 Sistema de Alerta Temprana de Incendios · Amazonia y Orinoquia")
st.caption("Un vistazo antes de los datos: qué mide este sistema y por qué importa.")

with st.expander("¿Qué son los focos de incendio y de dónde salen estos datos?", expanded=True):
    st.markdown(
        """
Los satélites orbitan la Tierra y miden **temperatura en cada punto de la superficie**.
Cuando detectan calor inusual en una zona —señal de fuego activo, quema de vegetación
o suelo recién calcinado— lo registran como un **"foco de incendio"** o **punto de calor**.

En Colombia, el sistema **SIATAC** consolida estos datos satelitales desde 2017.
Este dashboard usa esos registros históricos para entender patrones, y un modelo
matemático para **estimar los próximos 6 meses**.
        """
    )

with st.expander("¿Por qué monitorear la Amazonia y la Orinoquia?"):
    st.markdown(
        """
Esta región concentra los **10 departamentos** que cubre el sistema: Amazonas, Caquetá,
Cauca, Guainía, Guaviare, Meta, Nariño, Putumayo, Vaupés y Vichada.

Son la **frontera agrícola más activa del país** y albergan ecosistemas únicos.
Un mes de alta actividad de incendios puede significar miles de hectáreas de selva
perdidas, afectación a comunidades indígenas, y emisiones de carbono equivalentes
a años de tráfico urbano.
        """
    )

with st.expander("¿Qué hace exactamente este sistema?"):
    st.markdown(
        """
Analiza años de datos satelitales históricos y usa un modelo estadístico para estimar,
con **6 meses de anticipación**, qué tan probable es que cada departamento experimente
alta actividad de incendios.

**No predice el futuro con certeza —ningún modelo puede—**, pero identifica los
departamentos y meses donde la historia y los patrones estacionales sugieren mayor alerta.
Es una herramienta de **priorización**, no una bola de cristal.
        """
    )

st.divider()

# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🔥 Alerta de Riesgo")
    st.markdown("**Amazonia · Orinoquia · Colombia**")
    st.caption("Sistema de predicción de puntos de calor (incendios / deforestación)")
    st.divider()

    st.markdown(
        "**Usa este selector para ver el pronóstico de cada mes.** "
        "El sistema estimó los próximos 6 meses a partir del último dato "
        "disponible de cada departamento."
    )

    # Selector de mes: orden cronológico
    meses_df = (
        df_pred[["mes", "anio", "etiqueta"]]
        .drop_duplicates()
        .sort_values(["anio", "mes"])
        .reset_index(drop=True)
    )
    etiquetas = meses_df["etiqueta"].tolist()
    idx_sel = st.selectbox(
        "📅 Mes a visualizar",
        range(len(etiquetas)),
        format_func=lambda i: etiquetas[i],
        index=1,          # por defecto muestra el 2.º mes (primero con alto riesgo)
    )
    mes_sel  = int(meses_df.loc[idx_sel, "mes"])
    anio_sel = int(meses_df.loc[idx_sel, "anio"])
    etiqueta_sel = etiquetas[idx_sel]

    st.divider()
    st.caption(f"Datos históricos: SIATAC · pronóstico generado para los próximos {len(etiquetas)} meses.")

# ─── Datos filtrados por mes ──────────────────────────────────────────────────
df_mes      = df_pred[(df_pred["mes"] == mes_sel) & (df_pred["anio"] == anio_sel)].copy()
df_coords_m = df_coords[df_coords["mes"] == mes_sel].copy()

n_deptos   = len(df_mes)
n_alto     = int((df_mes["riesgo_predicho"] == "alto").sum())
n_medio    = int((df_mes["riesgo_predicho"] == "medio").sum())
n_bajo     = int((df_mes["riesgo_predicho"] == "bajo").sum())
total_pred = int(df_mes["total_predicho"].sum())

# Promedio histórico regional para este mes calendario (referencia "hacia atrás")
promedio_region_mes = float(avg_region_mes.get(mes_sel, np.nan)) if len(avg_region_mes) else np.nan

# ─── Fila de KPIs (traducidos a lenguaje accionable) ─────────────────────────
st.markdown(f"### 🚦 El semáforo de {etiqueta_sel}")
st.caption(
    "Estos números resumen el pronóstico del mes seleccionado. "
    "Los departamentos en rojo son los que requieren atención prioritaria."
)

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("🔴 Alto riesgo",  n_alto,  f"de {n_deptos} deptos.")
c2.metric("🟡 Riesgo medio", n_medio, f"de {n_deptos} deptos.")
c3.metric("🟢 Bajo riesgo",  n_bajo,  f"de {n_deptos} deptos.")
c4.metric("🔥 Focos de incendio estimados", f"{total_pred:,}")
if not np.isnan(promedio_region_mes):
    delta_hist = total_pred - promedio_region_mes
    c5.metric(
        f"📊 Promedio histórico en {MESES_ES[mes_sel]}",
        f"{promedio_region_mes:,.0f}",
        f"{delta_hist:+,.0f} vs. lo estimado",
        delta_color="inverse",
    )
else:
    c5.metric("📊 Promedio histórico", "Sin datos")

st.info(
    f"🎯 **¿Qué tan confiable es esto?** El modelo acierta el nivel de riesgo "
    f"(bajo/medio/alto) en **{aciertos_de_10(mc.get('accuracy', 0))} de cada 10 meses** evaluados. "
    "Cuando falla, casi siempre es por una categoría adyacente (ej. predice 'medio' cuando era 'alto'), "
    "no un error opuesto. Más detalle en la pestaña **¿Qué tan confiable es?**"
)

st.divider()

# ─── Pestañas ─────────────────────────────────────────────────────────────────
tab0, tab1, tab2, tab3, tab4 = st.tabs([
    "🧭  ¿Cómo se hizo esto?",
    "🗺️  El semáforo del mes",
    "📍  ¿Dónde ha ocurrido históricamente?",
    "📊  ¿Cómo evolucionan los 6 meses?",
    "🧮  ¿Qué tan confiable es?",
])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 0 · Cómo se construyó el sistema, paso a paso (para audiencia general)
# ══════════════════════════════════════════════════════════════════════════════
with tab0:
    n_deptos_total = df_pred["departamento"].nunique()
    horizonte = meta.get("parametros", {}).get("horizonte_meses", 6)
    meses_prueba = meta.get("parametros", {}).get("meses_evaluados_por_departamento", 12)

    st.markdown("### De los satélites a la predicción: el camino completo")
    st.caption(
        "Ningún paso de este proceso usa magia ni una \"caja negra\" incomprensible. "
        "Es una secuencia de pasos, cada uno explicado a continuación."
    )

    st.markdown("#### Paso 1 · Se recolectaron 9 años de historia satelital")
    st.markdown(
        f"""
Desde **enero de 2017 hasta hoy**, se descargaron todos los registros de puntos
de calor que el sistema oficial **SIATAC** tiene disponibles para los
**{n_deptos_total} departamentos** de la Amazonia y la Orinoquia. Cada registro
indica cuándo y en qué municipio un satélite detectó una anomalía de calor
compatible con fuego activo.

Esto no es una muestra pequeña: son **cientos de miles de detecciones
satelitales** acumuladas durante casi una década, la materia prima de todo lo demás.
        """
    )

    st.markdown("#### Paso 2 · Se organizaron por mes y departamento")
    st.markdown(
        """
Los registros individuales se agruparon para saber, **mes por mes y departamento
por departamento, cuántos focos de incendio hubo en total**. Un mes sin ningún
registro se cuenta como cero —no se descarta ni se ignora—, porque un mes
tranquilo también es información valiosa para el modelo.

El resultado es una "línea de tiempo" ordenada para cada departamento: 114 meses
consecutivos, cada uno con su conteo de focos.
        """
    )

    st.markdown("#### Paso 3 · Se le enseñó al modelo a reconocer patrones")
    st.markdown(
        """
Aquí es donde entra el modelo estadístico. En vez de que una persona escriba
reglas a mano ("si es diciembre y hubo sequía, sube el riesgo"), **se le muestran
al modelo cientos de ejemplos históricos reales** y él mismo descubre qué
combinaciones de información pasada anticipan mejor lo que viene.

Para cada mes de cada departamento, el modelo recibe pistas como:

- ¿Cuántos focos hubo el mes pasado?
- ¿Cuántos hubo hace 3, 6 y 12 meses?
- ¿Cuál es el promedio de los últimos meses?
- ¿En qué época del año estamos?
- ¿De qué departamento se trata?

Con esas pistas, aprende a estimar el número de focos del mes siguiente.
Es literalmente lo mismo que haría una persona muy observadora con un cuaderno
de anotaciones —solo que el modelo puede revisar miles de combinaciones en segundos.
        """
    )

    st.markdown("#### Paso 4 · Se puso a prueba antes de confiar en él")
    st.markdown(
        f"""
Antes de usar el modelo para predecir el futuro real, se hizo un examen honesto:
se le **ocultaron los últimos {meses_prueba} meses** de cada departamento —como
tapar la última página de un libro— y se le pidió que adivinara qué había
ocurrido, usando solo lo que "sabía" hasta ese punto.

Después se comparó su adivinanza contra lo que realmente pasó. Así se obtuvieron
las cifras de confiabilidad que puedes ver en la pestaña **¿Qué tan confiable es?**
Este paso es clave: sin él, no tendríamos ninguna forma honesta de saber si el
modelo realmente aprendió algo útil o solo está adivinando.
        """
    )

    st.markdown("#### Paso 5 · Con el modelo ya evaluado, se proyectan los próximos 6 meses")
    st.markdown(
        f"""
Una vez confirmado que el modelo funciona razonablemente bien, se usa **toda**
la historia disponible (sin ocultar nada esta vez) para estimar los
**próximos {horizonte} meses**, mes por mes, para cada departamento.

Cada mes futuro se calcula usando como referencia los meses anteriores —incluyendo
los meses futuros que el propio modelo ya estimó antes. Por eso la incertidumbre
crece un poco a medida que el pronóstico se aleja en el tiempo: el sexto mes se
apoya parcialmente en estimaciones previas, no solo en datos reales.

El resultado final —focos estimados, nivel de riesgo y margen de variación por
departamento y mes— es exactamente lo que ves en las pestañas siguientes.
        """
    )

    st.success(
        "🧭 **En una frase:** se le mostró al modelo casi una década de historia real, "
        "se comprobó qué tan bien predice ocultándole el examen final, y solo después "
        "de aprobar ese examen se le dejó proyectar lo que viene."
    )

    with st.expander("¿Por qué confiar en un modelo y no solo en la intuición de un experto?"):
        st.markdown(
            """
No se trata de reemplazar a los expertos, sino de darles una herramienta adicional.
Una persona puede recordar bien los últimos 2 o 3 años de un departamento que conoce
de cerca. El modelo puede tener en cuenta **simultáneamente 9 años de historia de
los 10 departamentos**, algo que ningún ojo humano puede sostener con precisión.

Además, el modelo es consistente: aplica el mismo criterio a todos los
departamentos y meses, sin el sesgo de "el último incendio grande que recuerdo".
Lo ideal es usar ambas cosas juntas: el pronóstico como punto de partida, y el
conocimiento del terreno para interpretarlo y decidir.
            """
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 · Mapa coropleta de nivel de riesgo
# ══════════════════════════════════════════════════════════════════════════════
with tab1:
    st.markdown(
        "🟢 **Verde** = actividad normal o baja esperada, según el historial de ese departamento.  "
        "🟡 **Naranja** = actividad moderada, por encima de su propio promedio histórico.  "
        "🔴 **Rojo** = actividad alta, potencialmente peligrosa según su historial. "
        "*(La escala de cada color es propia de cada departamento: ver más abajo por qué.)*"
    )

    col_map, col_tabla = st.columns([3, 2])

    with col_map:
        st.markdown(f"#### Nivel de riesgo por departamento — {etiqueta_sel}")

        # Incluir los 33 departamentos del geojson: los que no tienen predicción
        # se marcan como "sin datos" y se pintan en gris.
        deptos_geo = [ft["properties"]["DPTO_CNMBR"] for ft in geojson["features"]]
        df_mapa = (
            pd.DataFrame({"departamento": deptos_geo})
            .merge(df_mes, on="departamento", how="left")
        )
        df_mapa["riesgo_predicho"] = df_mapa["riesgo_predicho"].fillna("sin datos")

        # Frase de contexto del umbral para el hover (reemplaza el número seco)
        df_mapa["contexto_umbral"] = df_mapa.apply(
            lambda r: frase_umbral(
                r["riesgo_predicho"], r.get("total_predicho", 0), *parse_umbral_dept(meta, r["departamento"])
            ),
            axis=1,
        )

        color_map_mapa = {**COLOR_DISC, "sin datos": "#9ca3af"}

        # Choropleth: los 33 deptos del geojson, coloreados según predicción
        fig_choro = px.choropleth(
            df_mapa,
            geojson=geojson,
            locations="departamento",
            featureidkey="properties.DPTO_CNMBR",
            color="riesgo_predicho",
            color_discrete_map=color_map_mapa,
            category_orders={"riesgo_predicho": ["bajo", "medio", "alto", "sin datos"]},
            hover_name="departamento",
            custom_data=["contexto_umbral"],
            labels={"riesgo_predicho": "Riesgo"},
        )
        fig_choro.update_traces(
            hovertemplate="<b>%{hovertext}</b><br>%{customdata[0]}<extra></extra>"
        )
        # Enmarcar manualmente en Colombia para mostrar SIEMPRE todos los 33 deptos
        fig_choro.update_geos(
            visible=False,
            lataxis_range=[-5.0, 13.0],
            lonaxis_range=[-82.0, -65.5],
            bgcolor="rgba(0,0,0,0)",
        )
        fig_choro.update_layout(
            height=520,
            margin={"r": 0, "t": 0, "l": 0, "b": 0},
            legend_title_text="Nivel de riesgo",
            paper_bgcolor="rgba(0,0,0,0)",
            geo_bgcolor="rgba(0,0,0,0)",
        )
        st.plotly_chart(fig_choro, use_container_width=True)

    with col_tabla:
        st.markdown(f"#### Detalle por departamento")
        st.caption("Ordenado por focos estimados (mayor a menor)")

        df_show = (
            df_mes[["departamento", "riesgo_predicho", "total_predicho", "incertidumbre_estimada"]]
            .sort_values("total_predicho", ascending=False)
            .rename(columns={
                "departamento": "Departamento",
                "riesgo_predicho": "Riesgo",
                "total_predicho": "Focos estimados",
                "incertidumbre_estimada": "Margen de variación",
            })
        )

        # Colorear celda de Riesgo
        def color_riesgo(s):
            styles = {
                "alto":  "background-color:#fde8e8; color:#9b1c1c; font-weight:600",
                "medio": "background-color:#fef3c7; color:#92400e; font-weight:600",
                "bajo":  "background-color:#d1fae5; color:#065f46; font-weight:600",
            }
            return [styles.get(v, "") for v in s]

        styled = df_show.style.apply(color_riesgo, subset=["Riesgo"])
        st.dataframe(styled, use_container_width=True, height=420, hide_index=True)

        st.caption(
            "💡 **¿Qué es el margen de variación?** Indica qué tan de acuerdo están "
            "los 300 \"mini-modelos\" que componen el sistema. Un margen alto (ej. ±200) "
            "significa menos certeza sobre el número exacto —aunque el color (riesgo) "
            "sigue siendo la estimación más probable. Ver más en la última pestaña."
        )

    with st.expander("¿Por qué cada departamento tiene su propia escala de riesgo?"):
        st.markdown(
            """
Caquetá y Meta históricamente registran **miles** de focos al mes; Nariño y Cauca
registran apenas decenas. Si usáramos una sola escala nacional, Nariño nunca
llegaría a "alto" y Caquetá nunca bajaría de ahí, sin importar lo que pase.

Por eso cada departamento tiene sus propios umbrales, calculados sobre **su propio
historial** (los percentiles 33 y 66 de sus datos). Un Nariño en rojo significa
que está teniendo un mes inusualmente activo **para sus propios estándares**,
no que tenga más focos que Caquetá.
            """
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 · Mapa de puntos de calor (coordenadas históricas, alto riesgo)
# ══════════════════════════════════════════════════════════════════════════════
with tab2:
    st.markdown("#### ¿Dónde se han concentrado históricamente los focos de incendio?")
    st.markdown(
        """
Cada punto en el mapa representa una ubicación donde un satélite detectó una
anomalía de calor compatible con fuego activo, **en los últimos años, durante
este mismo mes calendario**. Son la huella histórica de dónde es más probable
que ocurra actividad si el modelo predice riesgo alto para el mes seleccionado.
        """
    )

    with st.expander("¿Qué es exactamente un 'punto de calor'?"):
        st.markdown(
            """
Los satélites no ven llamas directamente. Miden la **temperatura de cada píxel**
de la superficie terrestre. Cuando una zona supera cierto umbral térmico —señal
de fuego activo o suelo muy caliente por una quema reciente— el satélite lo
registra como un **"punto de calor"** o **foco de incendio**.

No todos los puntos de calor son incendios forestales: algunos son quemas
agrícolas controladas. Pero la concentración y frecuencia de estos puntos es
el mejor indicador satelital disponible de actividad de fuego en una región.
            """
        )

    if df_coords_m.empty:
        st.success(
            f"✅ En **{etiqueta_sel}** el modelo no predice riesgo alto para ningún "
            "departamento, por lo tanto no hay coordenadas históricas de alerta que "
            "mostrar. **Esto es una buena señal.** Prueba otro mes en el selector de "
            "la izquierda para ver zonas con actividad histórica relevante."
        )
    else:
        deptos_alto = sorted(df_coords_m["departamento"].unique().tolist())
        n_pts = len(df_coords_m)
        rango_anios = df_coords_m["anios_considerados"].iloc[0] if "anios_considerados" in df_coords_m.columns and not df_coords_m.empty else ""

        st.caption(
            f"Se muestran **{n_pts:,} focos históricos** ({rango_anios or '2024–2026'}) registrados en "
            f"este mismo mes calendario en los departamentos: {', '.join(deptos_alto)}."
        )

        # Filtro por departamento (sin recargar la página)
        opc_deptos = ["Todos los departamentos"] + deptos_alto
        depto_fil = st.selectbox("Filtrar por departamento", opc_deptos, key="fil_depto_tab2")

        df_plot = df_coords_m if depto_fil == "Todos los departamentos" else df_coords_m[df_coords_m["departamento"] == depto_fil]
        n_vis = len(df_plot)
        st.caption(f"Mostrando {n_vis:,} de {n_pts:,} focos")

        # Mapa de dispersión sobre mapa base
        fig_sc = px.scatter_mapbox(
            df_plot,
            lat="latitud",
            lon="longitud",
            color="departamento",
            color_discrete_sequence=px.colors.qualitative.Bold,
            hover_data={"departamento": True, "latitud": ":.4f", "longitud": ":.4f"},
            zoom=4.8,
            center=COLOMBIA_CENTER,
            height=560,
            opacity=0.55,
        )
        fig_sc.update_traces(marker={"size": 5})
        fig_sc.update_layout(
            mapbox_style="carto-positron",
            margin={"r": 0, "t": 0, "l": 0, "b": 0},
            legend_title_text="Departamento",
        )
        st.plotly_chart(fig_sc, use_container_width=True)

        # Tabla resumen
        st.markdown("##### Resumen por departamento")
        resumen = (
            df_coords_m.groupby("departamento")
            .size()
            .reset_index(name="Focos registrados históricamente")
        )
        pred_alto = df_mes[df_mes["riesgo_predicho"] == "alto"][
            ["departamento", "total_predicho", "incertidumbre_estimada"]
        ].rename(columns={
            "departamento": "departamento",
            "total_predicho": "Focos estimados (pronóstico)",
            "incertidumbre_estimada": "Margen de variación",
        })
        resumen = resumen.merge(pred_alto, on="departamento", how="left").rename(
            columns={"departamento": "Departamento"}
        )
        st.dataframe(resumen, use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 · Análisis por departamento
# ══════════════════════════════════════════════════════════════════════════════
with tab3:
    st.markdown("#### ¿Cómo evoluciona el riesgo en los próximos 6 meses?")
    col_bar, col_heat = st.columns(2)

    with col_bar:
        st.markdown(f"##### Focos estimados — {etiqueta_sel}")
        st.caption("La línea punteada marca el umbral de riesgo alto propio de cada departamento.")

        df_bar = df_mes.sort_values("total_predicho", ascending=True).reset_index(drop=True)
        df_bar["umbral_alto"] = df_bar["departamento"].apply(lambda d: parse_umbral_dept(meta, d)[1])

        fig_bar = px.bar(
            df_bar,
            x="total_predicho",
            y="departamento",
            color="riesgo_predicho",
            color_discrete_map=COLOR_DISC,
            category_orders={"riesgo_predicho": ["bajo", "medio", "alto"]},
            orientation="h",
            text="total_predicho",
            labels={
                "total_predicho": "Focos estimados",
                "departamento": "",
                "riesgo_predicho": "Riesgo",
            },
        )
        fig_bar.update_traces(texttemplate="%{text:,.0f}", textposition="outside")
        # Marcador del umbral de riesgo alto propio de cada departamento
        fig_bar.add_trace(go.Scatter(
            x=df_bar["umbral_alto"],
            y=df_bar["departamento"],
            mode="markers",
            marker=dict(symbol="line-ns", size=18, line=dict(width=2, color="#374151")),
            name="Umbral de riesgo alto",
            showlegend=True,
            hovertemplate="Umbral de riesgo alto: %{x:,.0f}<extra></extra>",
        ))
        fig_bar.update_layout(
            height=400,
            margin={"t": 10, "b": 10},
            xaxis_title="Focos de incendio estimados",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0),
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    with col_heat:
        st.markdown("##### Evolución del riesgo — todos los meses pronosticados")
        # Pivot: departamento × mes, valor = orden_riesgo (1/2/3)
        df_piv = df_pred.pivot_table(
            index="departamento",
            columns="etiqueta",
            values="orden_riesgo",
            aggfunc="first",
        )
        # Ordenar columnas cronológicamente
        col_order = (
            df_pred[["etiqueta", "anio", "mes"]]
            .drop_duplicates()
            .sort_values(["anio", "mes"])["etiqueta"]
            .tolist()
        )
        col_order = [c for c in col_order if c in df_piv.columns]
        df_piv = df_piv[col_order]

        fig_heat = px.imshow(
            df_piv,
            color_continuous_scale=[[0, "#22c55e"], [0.5, "#f59e0b"], [1, "#ef4444"]],
            zmin=1, zmax=3,
            aspect="auto",
            text_auto=False,
        )
        fig_heat.update_coloraxes(
            colorbar=dict(
                title="Riesgo",
                tickvals=[1, 2, 3],
                ticktext=["🟢 Bajo", "🟡 Medio", "🔴 Alto"],
                len=0.6,
            )
        )
        # Añadir texto (palabra completa, no letra suelta) encima de cada celda
        etiqueta_riesgo = {1: "Bajo", 2: "Medio", 3: "Alto"}
        for dept_i, dept in enumerate(df_piv.index):
            for col_i, col in enumerate(df_piv.columns):
                val = df_piv.loc[dept, col]
                if not np.isnan(val):
                    fig_heat.add_annotation(
                        x=col_i, y=dept_i,
                        text=etiqueta_riesgo.get(int(val), ""),
                        showarrow=False,
                        font={"color": "white", "size": 10},
                    )
        fig_heat.update_layout(
            height=400,
            margin={"t": 10, "b": 10},
            xaxis_title="",
            yaxis_title="",
            xaxis={"tickangle": -30},
        )
        st.plotly_chart(fig_heat, use_container_width=True)

    st.markdown("##### Tabla completa de predicciones")

    df_full = df_pred.sort_values(["departamento", "anio", "mes"]).copy()
    # Cruce con el promedio histórico del mismo mes calendario (dato "hacia atrás")
    df_full = df_full.merge(avg_mes_depto, on=["mes", "departamento"], how="left")
    df_full["vs_historico"] = df_full["total_predicho"] - df_full["promedio_historico"]

    df_full_show = df_full[[
        "departamento", "etiqueta", "total_predicho", "promedio_historico",
        "vs_historico", "incertidumbre_estimada", "riesgo_predicho",
    ]].rename(columns={
        "departamento": "Departamento",
        "etiqueta": "Mes",
        "total_predicho": "Focos estimados",
        "promedio_historico": "Promedio histórico (mismo mes)",
        "vs_historico": "vs. promedio histórico",
        "incertidumbre_estimada": "Margen de variación",
        "riesgo_predicho": "Riesgo",
    })

    def color_riesgo_full(s):
        styles = {
            "alto":  "background-color:#fde8e8; color:#9b1c1c; font-weight:600",
            "medio": "background-color:#fef3c7; color:#92400e; font-weight:600",
            "bajo":  "background-color:#d1fae5; color:#065f46; font-weight:600",
        }
        return [styles.get(v, "") for v in s]

    st.dataframe(
        df_full_show.style
            .apply(color_riesgo_full, subset=["Riesgo"])
            .format({
                "Focos estimados": "{:,.0f}",
                "Promedio histórico (mismo mes)": "{:,.0f}",
                "vs. promedio histórico": "{:+,.0f}",
                "Margen de variación": "{:,.1f}",
            }),
        use_container_width=True,
        height=380,
        hide_index=True,
    )
    st.caption(
        "**vs. promedio histórico** compara el pronóstico contra lo que ese departamento "
        "registró en promedio, en años anteriores, durante ese mismo mes calendario. "
        "Un valor positivo grande indica un mes atípicamente activo respecto a su propia historia."
    )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 · Métricas del modelo (traducidas a lenguaje cotidiano)
# ══════════════════════════════════════════════════════════════════════════════
with tab4:
    st.markdown("#### ¿Qué tan confiable es este sistema?")

    with st.expander("¿Cómo funciona el modelo? (una analogía sencilla)", expanded=True):
        st.markdown(
            """
Imagina que llevas años anotando en un cuaderno cuántos incendios ocurren cada
mes en cada departamento. Con el tiempo empiezas a notar patrones: **Caquetá
siempre tiene más focos en diciembre que en marzo; si agosto fue muy activo,
septiembre tiende a serlo también.**

Este sistema hace exactamente eso, pero con un computador que puede revisar
miles de combinaciones de esas anotaciones en segundos y encontrar patrones
que el ojo humano no detectaría fácilmente.
            """
        )

    total_predicho_general = int(df_pred["total_predicho"].sum())
    n_aciertos = aciertos_de_10(mc.get("accuracy", 0))

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown(
            f"""
**¿Con qué frecuencia acierta el nivel de riesgo?**

De cada 10 meses evaluados, el modelo clasifica correctamente el nivel de
riesgo (bajo / medio / alto) en aproximadamente **{n_aciertos} de ellos**.
Cuando falla, casi siempre cae en la categoría vecina (predice "medio" cuando
era "alto"), no en el extremo opuesto.
            """
        )
    with col_b:
        r2_pct = mr.get("r2", 0) * 100
        st.markdown(
            f"""
**¿Qué tan preciso es el número exacto de focos?**

El modelo logra explicar aproximadamente **{r2_pct:.0f}%** de la variación
que ocurre mes a mes en la cantidad de focos. El resto depende de factores
que no están en los datos: lluvias repentinas, decisiones humanas, eventos
climáticos puntuales como El Niño o La Niña.
            """
        )

    st.markdown(
        f"""
**¿Y el margen de error en focos concretos?** En promedio, el modelo se
equivoca en **±{mr.get('mae', 0):,.0f} focos por mes**. Para departamentos con
miles de focos al mes (como Caquetá o Meta) este margen es razonable. Para
departamentos con pocos focos (como Nariño) el mismo margen puede ser
significativo en términos relativos —por eso el **nivel de riesgo (color)**
es más confiable que el número exacto.
        """
    )

    with st.expander("Ver métricas técnicas detalladas (para especialistas)"):
        col_met, col_umb = st.columns(2)
        with col_met:
            st.markdown("**Regresión** · predicción del conteo mensual")
            df_mreg = pd.DataFrame([
                {"Métrica": "MAE — Error Absoluto Medio",  "Valor": f"{mr.get('mae', 0):,.1f} focos/mes"},
                {"Métrica": "RMSE — Raíz Error Cuadrático", "Valor": f"{mr.get('rmse', 0):,.1f} focos/mes"},
                {"Métrica": "R² — Coef. de determinación",  "Valor": f"{mr.get('r2', 0):.3f}  (1.0 = perfecto)"},
                {"Métrica": "Meses de prueba por departamento", "Valor": str(mr.get("meses_evaluados_por_departamento", 12))},
            ])
            st.dataframe(df_mreg, use_container_width=True, hide_index=True)

            st.markdown("**Clasificación de riesgo** · bajo / medio / alto")
            df_mclf = pd.DataFrame([
                {"Métrica": "Accuracy",        "Valor": f"{mc.get('accuracy', 0):.1%}"},
                {"Métrica": "Precision macro", "Valor": f"{mc.get('precision_macro', 0):.3f}"},
                {"Métrica": "Recall macro",    "Valor": f"{mc.get('recall_macro', 0):.3f}"},
                {"Métrica": "F1 macro",        "Valor": f"{mc.get('f1_macro', 0):.3f}"},
            ])
            st.dataframe(df_mclf, use_container_width=True, hide_index=True)

        with col_umb:
            st.markdown("**Umbrales de riesgo por departamento** (percentiles 33/66 históricos)")
            umb_rows = []
            for dept, vals in meta.get("umbrales_riesgo", {}).items():
                umb_rows.append({
                    "Departamento": dept,
                    "Bajo (focos/mes)": vals.get("bajo", ""),
                    "Medio (focos/mes)": vals.get("medio", ""),
                    "Alto (focos/mes)": vals.get("alto", ""),
                })
            st.dataframe(
                pd.DataFrame(umb_rows).sort_values("Departamento"),
                use_container_width=True,
                hide_index=True,
                height=380,
            )

        st.caption(
            f"Modelo: {meta.get('modelo', 'RandomForestRegressor')}. "
            "Evaluación con partición temporal (los últimos meses de cada "
            "departamento se reservaron como prueba, nunca vistos en entrenamiento)."
        )

    st.divider()

    with st.expander("¿Qué significa el 'margen de variación' que aparece en los mapas y tablas?"):
        st.markdown(
            """
El margen de variación indica **qué tan de acuerdo están** los cerca de 300
"mini-modelos" (árboles de decisión) que componen el sistema.

- Cuando el margen es **bajo** (ej. ±3), casi todos los mini-modelos coinciden
  casi exactamente en su estimación.
- Cuando el margen es **alto** (ej. ±200), hay más desacuerdo entre ellos:
  el número central sigue siendo el mejor estimado disponible, pero la
  realidad puede alejarse más de él.

Un margen alto **no invalida** el nivel de riesgo (verde / naranja / rojo),
pero sí indica que el número exacto de focos debe tomarse con más cautela.
            """
        )

    st.markdown("#### ¿Qué información usa el modelo para predecir?")

    imp = meta.get("importancia_variables", {})
    df_imp = pd.DataFrame([
        {"Variable": FRIENDLY_VARS.get(k, k), "Importancia": v}
        for k, v in imp.items()
    ])
    # mes_sin y mes_cos comparten el mismo nombre legible: se combinan en una sola barra
    df_imp = df_imp.groupby("Variable", as_index=False)["Importancia"].sum()
    df_imp["%"] = (df_imp["Importancia"] * 100).round(1)
    df_imp = df_imp.sort_values("Importancia", ascending=False)

    fig_imp = px.bar(
        df_imp,
        x="Importancia",
        y="Variable",
        orientation="h",
        text="%",
        color="Importancia",
        color_continuous_scale=["#93c5fd", "#1d4ed8"],
        labels={"Importancia": "Importancia relativa", "Variable": ""},
    )
    fig_imp.update_traces(
        texttemplate="%{text:.1f}%",
        textposition="outside",
    )
    fig_imp.update_layout(
        height=460,
        showlegend=False,
        coloraxis_showscale=False,
        margin={"t": 10, "b": 10, "r": 60},
        yaxis={"categoryorder": "total ascending"},
    )
    st.plotly_chart(fig_imp, use_container_width=True)

    top_var_pct = df_imp.iloc[0]["%"] if len(df_imp) else 0
    st.success(
        f"💡 **Conclusión:** el modelo descubrió que lo más importante para predecir los "
        f"focos de incendio de un mes es **lo que pasó en ese mismo mes, un año antes** "
        f"(representa el {top_var_pct:.0f}% del peso de la predicción). Esto confirma que "
        "los incendios en la Amazonia y la Orinoquia siguen un **patrón estacional muy "
        "fuerte**, ligado a las temporadas secas que se repiten año tras año."
    )

# ─── Footer ──────────────────────────────────────────────────────────────────
st.divider()
st.caption(
    "Fuente de datos históricos: SIATAC · Puntos de calor satelitales. "
    "Todo pronóstico mostrado proviene de predicciones_riesgo_6_meses.json "
    f"(modelo: {meta.get('modelo', 'RandomForestRegressor')}). "
    "El detalle histórico hacia atrás proviene del registro satelital crudo."
)

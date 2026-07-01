# AmazonIA

AmazonIA es una plataforma web construida con Next.js para el monitoreo ambiental de la Amazonia colombiana. El proyecto centraliza indicadores, mapas, predicciones y simuladores para apoyar el analisis de la deforestacion y la toma de decisiones.

## Requisitos

- Node.js 18 o superior
- `pnpm` instalado globalmente

## Instalacion

```bash
pnpm install
```

Este comando descarga todas las dependencias definidas en `package.json`.

## Desarrollo

```bash
pnpm dev
```

Luego abre [http://localhost:3000](http://localhost:3000) para ver la aplicacion.

## Produccion

```bash
pnpm build
pnpm start
```

`pnpm build` genera la version optimizada y `pnpm start` levanta el servidor de produccion.

## Estructura del proyecto

- `app/`: rutas y paginas principales de la aplicacion
- `components/`: componentes reutilizables de dashboard, layout, simulador y predicciones
- `data/`: datos mock usados para poblar las vistas
- `lib/`: utilidades compartidas
- `store/`: estado global
- `types/`: tipos de TypeScript

## Secciones disponibles

- `/`: dashboard principal con KPIs, mapa, historico y panel de prediccion
- `/acerca`: informacion general del proyecto
- `/estado`: estado actual del territorio
- `/deforestacion`: analisis de deforestacion
- `/juego`: experiencia interactiva o dinamica tipo juego
- `/predicciones`: vista de modelos y escenarios
- `/simulador`: simulador de decisiones y resultados

## Notas

El proyecto usa el App Router de Next.js, TypeScript y componentes visuales basados en datos mock para facilitar el desarrollo y las pruebas de interfaz.

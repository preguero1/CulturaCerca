# CulturaCerca

Prototipo web responsive para descubrir, filtrar, guardar y reservar eventos culturales cercanos.
Trabajo final de la asignatura HCI: Desarrollo web y móvil.

## Funcionalidades

- Listado de eventos cercanos con búsqueda.
- Filtros por categoría, fecha, distancia, gratuitos y accesibilidad.
- Detalle del evento.
- Lista personal con aviso y opción de deshacer.
- Reserva de entradas en tres pasos (entradas, datos, confirmación) con validación.
- Mis entradas, con código de reserva.
- Diseño responsive (móvil, tableta y escritorio) y accesible (WCAG 2.1 AA).

Los eventos son datos de ejemplo. El pago está simulado: no se piden datos bancarios ni se envía ningún correo.

## Estructura

```
CulturaCerca/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── data.js
    └── app.js
```

## Cómo ejecutarlo

Abre `index.html` en el navegador. No necesita servidor ni instalación.

Si prefieres un servidor local:

```
python3 -m http.server 8000
```

y visita http://localhost:8000.

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo y sube estos ficheros.
2. En **Settings → Pages**, elige la rama `main` y la carpeta raíz (`/`).
3. GitHub mostrará la dirección pública del prototipo.

## Almacenamiento

La lista de eventos y las reservas se guardan en el navegador (`localStorage`). Para empezar de cero, borra los datos del sitio.

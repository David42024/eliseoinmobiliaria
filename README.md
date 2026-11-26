# Elíseo Inmobiliaria · La Nueva Estancia

Primera versión del sitio comercial de La Nueva Estancia. Astro genera las páginas como HTML estático. El endpoint de solicitudes funciona en Cloudflare Pages, Cloudflare Workers y en el servidor Node local. El visor de lotes de desarrollo contiene datos ficticios identificados en pantalla. La compilación usa la consulta comercial mientras el inventario oficial esté desactivado.

## Instalación y despliegue

Usa Node.js 22.19 o posterior y npm. Ejecuta desde la raíz del proyecto.

```sh
npm ci
npm run dev
npm run check
npm run build:node
npm start
```

En desarrollo, abre `http://localhost:4321`. Detén el servidor de desarrollo antes de arrancar la compilación en el mismo puerto. Copia `.env.example` a `.env` para habilitar integraciones. Define `SITE_URL` con el origen público HTTPS antes de compilar. Así se generan URLs canónicas, metadatos sociales y las entradas del sitemap. Con el dominio sin configurar, el sitio incluye directivas para evitar la indexación.

### Cloudflare Pages

En Workers & Pages, crea un proyecto de **Pages** e importa el repositorio de GitHub.

| Campo en Pages | Valor |
| --- | --- |
| Project name | `eliseoinmobiliaria` |
| Production branch | `main` |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Root directory | Raíz del repositorio |

Usa **Settings → Variables and Secrets** para configurar el dominio con `SITE_URL=https://eliseoinmobiliaria.pages.dev` en producción. Si Pages asigna otra URL, usa el valor que figure en el panel. Para la compilación se recomienda Node 24. Agrega las flags de compatibilidad `nodejs_compat` y `global_fetch_strictly_public` para las funciones de producción y vista previa. El archivo `wrangler.jsonc` de la raíz corresponde a Workers. Pages usa su configuración del panel. [Configuración de Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [Variables y funciones](https://developers.cloudflare.com/pages/functions/bindings/)

Para probar localmente, ejecuta `npm run build:pages` y `npm run preview:pages`. La compilación conserva `_worker.js` y `_routes.json` para el endpoint de solicitudes.

### Cloudflare Workers

Importa el repositorio en Workers & Pages. La rama de producción es `main` y el directorio de trabajo es la raíz del repositorio.

| Campo en Workers Builds | Valor |
| --- | --- |
| Project name | `eliseoinmobiliaria` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |

`npm run build` genera el Worker y sus recursos en `dist-worker`. Para probar esa compilación en local ejecuta `npm run preview:worker`. La configuración de Wrangler vincula los recursos estáticos y pasa las rutas dinámicas a Astro.

En **Settings → Build → Build variables and secrets** configura `SITE_URL` con la URL pública definitiva y, si corresponde, `PUBLIC_GA4_ID` y `PUBLIC_LEAD_FORM=true`. Con la configuración inicial puedes publicar el sitio y atender consultas por WhatsApp. Activa el formulario al contar con la política de privacidad aprobada y los datos del CRM. Configura `CRM_WEBHOOK_TOKEN` como secreto del Worker y `CRM_WEBHOOK_URL` y `CRM_COPY_TO` en **Settings → Variables and Secrets**. Para pruebas locales de Workers puedes usar un archivo `.dev.vars` excluido de Git. [Variables de compilación y de ejecución](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#environment-variables)

### Servidor Node

Ejecuta `npm ci`, `npm run build:node` y `npm start`. Para un servidor remoto usa `HOST=0.0.0.0`, el puerto requerido por la plataforma y HTTPS en el proxy. La entrada Node sirve las páginas estáticas desde `dist/client` y la API desde `dist/server`.

Si cambian los datos públicos, las fechas de vigencia o las variables de compilación, recompila y despliega. Programa una recompilación al comienzo o fin de una vigencia cuando corresponda.

## Configuración del contenido

| Qué editar | Archivo |
| --- | --- |
| Datos del proyecto, tipologías, contactos y WhatsApp principal | `src/data/project.ts` |
| Lotes y capa interactiva del plano | `content/inventory.json` |
| Precios, vigencias y condiciones financieras | `content/prices.json` |
| Portada, galería, fichas, tour, maqueta y avances | `content/media.json` |
| Privacidad y Libro de Reclamaciones | `content/legal.json` |

Los PNG originales extraídos del formulario están en `brand-source/`. El sitio usa versiones optimizadas en `public/marca/`. La composición de portada utiliza el símbolo de Elíseo y trazos decorativos. Cuando exista un render oficial, configura `cover` para reemplazar la composición gráfica.

### Inventario y plano

Usa `templates/inventario.csv` o `templates/inventario.json`. El contrato usa `id` estable, `block` para manzana, `type` para tipología, `area` numérica en m², `orientation`, `location` comercial, `status` y `geometry` para la referencia al polígono. Los estados admitidos son `libre`, `separado` y `vendido`. Se validan IDs únicos sin distinción de mayúsculas.

```sh
npm run import:inventario -- inventario.csv
npm run import:inventario -- inventario.json
```

La importación CSV conserva la capa de geometría del destino. En JSON puedes incluir los lotes y el plano en el mismo archivo o importar un array de lotes. Cada valor de `geometries` contiene coordenadas SVG en el formato de polígonos `x,y x,y x,y`. Usa el `viewBox` del plano de arquitectura y, si se entrega una imagen base, introduce su URL relativa o HTTPS en `planImage`. Valida la coincidencia de las geometrías y las fichas y configura `published: true` después de la aprobación. Esta configuración hace que la compilación falle si falta cualquier polígono requerido. Los lotes, geometrías y estados de `inventory-demo.json` se reservan para `astro dev`.

Para adoptar un panel o CMS, conserva el esquema y los IDs. Define quién aprueba precios, inventario y medios. El publicador puede generar estos JSON como paso previo a la compilación y activar un nuevo despliegue al aprobar un cambio. Si se requieren cambios de disponibilidad inmediatos, conecta un inventario server-side, mantén el mismo contrato y define la frecuencia de actualización con el responsable comercial.

### Precios y cotizador

Usa `templates/precios.json` para agregar registros a `prices`. Los ámbitos son `project`, `typology`, `lot` y `parking`. El precio final de un lote se vincula a su `id` y se publica en dólares. Marca `approved: true` y asigna `validFrom` en formato AAAA-MM-DD. `validTo` es opcional e incluye el último día. Si coinciden registros vigentes, se usa el de fecha inicial más reciente. Los precios exactos permiten simular inicial y saldo cuando la tasa de inicial esté aprobada. Los precios «Desde» son informativos.

Los tramos, cupos y ajustes comerciales propuestos se conservan en `content/prices.local.json` para revisión interna. Este archivo queda fuera de Git y sirve como referencia para incorporar los valores aprobados en `content/prices.json`, que es la configuración que usa el sitio. Para hacer vigente un precio por lote, escribe su importe final aprobado en `prices`. Si un lote reúne varias condiciones de ubicación, confirma la regla con Elíseo antes de fijar ese importe. El sitio no acumula recargos ni calcula precios a partir de propuestas.

Arquitectura debe confirmar las superficies referenciales de 125 m² para el departamento y 162 m² de lote para la casa en conjunto. Registra las superficies y distribuciones confirmadas en `typologies` dentro de `content/media.json`.

Habilita cada modalidad con su descripción aprobada. Para activar cuotas registra TEA anual en porcentaje, meses y regla aprobada `cuota-fija-tea`. Esa regla usa amortización de cuota fija, tasa mensual equivalente y saldo después de la inicial. La simulación excluye cargos adicionales. Si las reglas aprobadas incluyen seguros, comisiones u otro método, amplía el cálculo antes de activarlas.

### Medios, tour y avance de obra

Usa `templates/medios.json` y `templates/avance.json`. Usa variantes AVIF o WebP con atributos `width`, `height`, `alt`, `srcset` y `full` cuando corresponda. Guarda medios livianos en `public/medios/` y considera un CDN para recorridos, modelos y videos pesados. Sirve los modelos, panoramas y videos 360° externos con CORS para el dominio de Elíseo. Publica hitos con fecha ISO, descripción, fotos o video y `approved: true`.

- **URL o ZIP web.** En `tour` usa `kind: "iframe"` y `src` con la URL publicada o la ruta al `index.html`. Para un ZIP oficial, extrae su árbol completo en `public/recorrido/` conservando nombres, subcarpetas y rutas relativas. El visor mantiene la navegación del proveedor. Usa `embed: false` si este bloquea el iframe. La opción de abrir en otra pestaña permanece disponible.
- **Panoramas equirectangulares.** Usa `kind: "panorama"` y una lista `scenes` con `id`, `title`, `group`, `src` y, opcionalmente, `hotspots` con `label`, `target` (ID), `yaw` y `pitch` en grados. Agrupa por vistas aéreas, peatonales, espacios del proyecto o interiores según el material. Usa `poster` como imagen ligera independiente del panorama.
- **Video o maqueta.** Usa `kind: "video"` para video convencional, `"video360"` para video esférico equirectangular y `"model"` para GLB/glTF. Para la maqueta adicional, configura el objeto `model`. Conserva las texturas junto al glTF si existen referencias externas. Pide exportación web o URL publicada si arquitectura entrega solo el archivo editable.

### Solicitudes, privacidad y medición

Configura en `content/legal.json` la URL oficial o la lista de párrafos aprobados de cada página. Para un Libro de Reclamaciones alojado en otro servicio usa `url` hacia el canal oficial. El formulario requiere un enlace de privacidad y `PUBLIC_LEAD_FORM=true` al compilar. Mientras se configura, los CTA funcionan vía WhatsApp con el contexto de la solicitud.

El webhook HTTPS recibe un POST JSON con cabecera `Authorization: Bearer …`, clave `Idempotency-Key` y datos validados. Debe registrar el lead antes de devolver HTTP 2xx y `{"confirmed":true,"id":"ID-CRM"}`. Implementa deduplicación por `requestId` en el CRM, incluidos los reintentos, y el envío de copias cuando `CRM_COPY_TO` esté configurado. El endpoint comprueba origen, consentimiento, inventario, tamaño, campo trampa y frecuencia. Usa un límite compartido en el proxy si despliegas varias réplicas y considera el reparto de IPs si el proxy balancea el tráfico.

Configura `PUBLIC_GA4_ID` al compilar. GA4 se carga si el visitante lo permite. Los eventos propios incluyen `select_lot`, `tour_start`, `whatsapp_click`, `visit_requested` y `quote_confirmed`. Los dos últimos dependen de confirmación del CRM. En GA4, desactiva la medición mejorada de formularios, clics salientes y vistas automáticas para mantener las reglas de privacidad de la implementación. Usa etiquetas de campaña sin datos personales. Las UTM para Meta Ads y TikTok Ads se conservan durante la sesión y acompañan el registro en el CRM. GA4 recibe la plataforma y el medio normalizados, y URLs sin parámetros. [Configuración de la etiqueta GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config?hl=es-419).

## Verificación local

La compilación pública y el chequeo de Astro pasaron. En Chrome se verificaron las nueve páginas comerciales, la selección de un lote de demostración con teclado y en pantalla táctil, los filtros, el zoom y el desplazamiento, el ID en el cotizador y el enlace de WhatsApp. Las pruebas verificaron también la exclusión de precios pendientes y del inventario ficticio del sitio público, y la importación CSV y JSON con rechazo de IDs duplicados y estados inválidos.

Una instancia aislada con datos sintéticos verificó la carga del tour solo tras activarlo, la navegación relativa del iframe, la vigencia de precios, los cálculos de inicial y saldo, el consentimiento y la atribución de GA4, y la respuesta del formulario ante un rechazo y una confirmación del CRM simulado. Los archivos oficiales y las integraciones reales requieren su propia verificación cuando se incorporen.

Medición del inicio compilado en Chrome 158 con viewport de 390 × 844, caché desactivada, CPU ralentizada 4× y red emulada de 1,6 Mbps de descarga, 750 kbps de subida y 150 ms de latencia. Las tres muestras de LCP fueron 1,076 s, 1,196 s y 1,136 s. CLS fue 0 en las tres muestras.

| Métrica | Mediana de laboratorio | Meta |
| --- | ---: | ---: |
| LCP | 1,14 s | ≤ 2,5 s |
| CLS | 0,00 | ≤ 0,1 |

## Pendientes para el lanzamiento de diciembre de 2026

- Arquitectura entrega el plano maestro georreferenciado cuando corresponda, sus polígonos, las fichas de tipología, renders y planos, el formato del tour y material verificable de avance.
- Elíseo entrega el inventario oficial, precios, vigencias, condiciones de financiamiento y criterios de ubicación comercial. Confirma metodología y tiempos si se publicarán traslados.
- Elíseo confirma el dominio, hosting, destino del CRM, si se envía copia y a qué correo, GA4 y los textos o enlaces oficiales de privacidad y Libro de Reclamaciones.
- Con estos datos, recompila, revisa la indexación y prueba los registros de extremo a extremo con el CRM acordado.

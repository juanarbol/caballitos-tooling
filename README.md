# Caballitos tooling

Esta son una serie de herramientas web de utileria para los caballitos del diablo.

## Lista de herramientas

* Converter de Icaro a Shopify
* Converter de Siglo a Shopify

## Deploy a GitHub Pages

La app se publica con GitHub Actions.

1. Entra a `Settings > Pages` del repositorio.
2. Selecciona `GitHub Actions` como fuente.
3. Haz push a `main` para disparar el deploy.

El workflow está en `.github/workflows/deploy-pages.yml` y compila Vite para publicar el contenido de `dist/` en Pages.

## Resumen de Notion en Cloudflare Workers

El Worker en `cf-workers/summary-notion.js` genera el resumen bajo demanda. Una petición `GET` devuelve texto plano listo para enviar por WhatsApp; las tareas con estado `Hecho` se excluyen.

1. Instala las dependencias con `npm install`.
2. Inicia sesión una vez con `npx wrangler login`.
3. Guarda el token de Notion como secreto: `npx wrangler secret put NOTION_TOKEN`.
4. Prueba localmente con `npm run worker:dev` o despliega con `npm run worker:deploy`.

Tras el despliegue, abre la URL que muestra Wrangler. El token no se guarda en el repositorio.
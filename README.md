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
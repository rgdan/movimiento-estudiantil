# Movimiento estudiantil del TEC

Guía de la organización, asociaciones y fuentes del movimiento estudiantil del TEC. HTML, CSS y JavaScript, sin dependencias de producción.

## Abrir

```sh
pnpm dlx serve@14 . --listen tcp://127.0.0.1:4173
```

Abrí <http://localhost:4173>.

## Editar

- `data/asociaciones.json`: asociaciones. Instagram usa el usuario sin `@`; los datos desconocidos quedan como `""`.
- `data/contenido.json`: órganos, relaciones, fuentes y perfiles de la Federación.
- `index.html`, `assets/css/` y `assets/js/`: estructura, estilos y lógica.

## Pruebas

Usá pnpm 12.16.1.

```sh
pnpm install --frozen-lockfile
pnpm test
```

## Publicar en GitHub Pages

En el repositorio, seleccioná **Settings → Pages → Build and deployment → Source → GitHub Actions**.

El flujo `.github/workflows/deploy-pages.yml` ejecuta las pruebas y publica el sitio con cada push a `main`. También se puede ejecutar manualmente desde **Actions → Deploy to GitHub Pages → Run workflow**.

Solo se publican `index.html`, `assets/` y `data/`.


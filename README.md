# Movimiento estudiantil del TEC

Guía estática en español: organización, asociaciones y fuentes. HTML, CSS y JavaScript nativos, sin dependencias de producción ni rastreo.

## Estructura

```text
index.html
assets/
  css/styles.css
  js/app.js
  js/directory.js
  js/theme.js
data/
  asociaciones.json
  contenido.json
tests/
  directory.test.js
```

## Abrir

Desde esta carpeta:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abrí <http://localhost:4173>. Los JSON necesitan un servidor HTTP; no abras el HTML con doble clic.

## Agregar asociaciones

Reemplazá los tres ejemplos en `data/asociaciones.json` por información verificada.

| Campo | Formato |
| --- | --- |
| `nombre`, `carrera` | Textos obligatorios. |
| `escuela_o_departamento` | Nombre completo; aparece en la información y se encuentra con la búsqueda. |
| `sede` | Cartago, San Carlos, San José, Limón u otra. |
| `instagram` | Usuario sin `@` ni URL. Dejá `""` si falta confirmar. |
| `activa` | `true` o `false`. Las inactivas siguen visibles e identificadas. |
| `descripcion` | Texto breve, opcional. |
| `junta` | Lista opcional de textos con cargo y nombre verificados. |
| `color` | Opcional, hexadecimal `#RRGGBB`. |

Con un usuario válido se habilita **Abrir Instagram**. No hay feeds ni scraping. Los ejemplos no contienen cuentas inventadas.

El directorio tiene búsqueda de texto y filtro por sede. La vista **Por sede** agrupa las asociaciones por campus.

Abrí **Más información → Enlace a esta asociación** para compartirla. El hash depende de nombre, carrera y sede; reordenar la lista no lo modifica, pero cambiar esos campos sí. Los enlaces directos abren la información y limpian los filtros que oculten el destino.

## Contenido y pruebas

`data/contenido.json` contiene los doce órganos y las tres vistas del diagrama. El campo opcional `sigla` aparece junto al nombre del órgano seleccionado. Cada relación declara un origen, una acción y sus destinos. Las etiquetas están en `index.html`; la paleta está en `assets/css/styles.css` y la lógica en `assets/js/`.

```sh
npm test
```

No necesita `npm install`. Las pruebas validan el directorio, su búsqueda y hashes, y que el diagrama represente todos los órganos sin referencias rotas.



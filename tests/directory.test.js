import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { associationId, filterAssociations, validateAssociations } from '../assets/js/directory.js';

const liveEntries = JSON.parse(await readFile(new URL('../data/asociaciones.json', import.meta.url)));
const entries = ['Cartago', 'San Carlos', 'San José'].map((sede, index) => ({
  nombre: `EJEMPLO · Asociación ${index}`,
  carrera: `Carrera por completar ${index}`,
  escuela_o_departamento: index === 1 ? 'Escuela Sur' : 'Escuela Norte',
  sede,
  instagram: '',
  activa: true
}));
const content = JSON.parse(await readFile(new URL('../data/contenido.json', import.meta.url)));

test('el directorio publicado es válido y no contiene ejemplos', () => {
  assert.doesNotThrow(() => validateAssociations(liveEntries));
  assert.ok(liveEntries.every(entry => !entry.nombre.startsWith('EJEMPLO')));
});

test('la búsqueda ignora tildes y mayúsculas y se combina con la sede', () => {
  assert.equal(filterAssociations(entries, { search: 'SAN JOSE' }).length, 1);
  assert.equal(filterAssociations(entries, { search: '  EJEMPLO   completar  ', sede: 'Cartago' }).length, 1);
  assert.equal(filterAssociations(entries, { search: 'Escuela Norte' }).length, 2);
  assert.equal(filterAssociations(entries, { search: 'Escuela Norte', sede: 'San Carlos' }).length, 0);
  assert.equal(filterAssociations(entries, { search: 'sin coincidencias' }).length, 0);
  assert.equal(filterAssociations(entries, { search: '   ' }).length, 3);
});

test('los enlaces son deterministas y no dependen del orden de la lista', () => {
  const id = associationId(entries[2]);
  assert.match(id, /^asociacion-[a-z0-9-]+$/);
  assert.equal(associationId([...entries].reverse()[0]), id);
  assert.equal(new Set(entries.map(associationId)).size, entries.length);
});

test('la validación rechaza URLs, HTML, usuarios inválidos y campos incorrectos', () => {
  for (const instagram of ['@usuario', 'https://instagram.com/usuario', '<script>', 'dos palabras', 'a'.repeat(31), 'x/../y']) {
    assert.throws(() => validateAssociations([{ ...entries[0], instagram }]));
  }
  for (const instagram of ['usuario', 'usuario.tec', 'usuario_tec', 'a', 'a'.repeat(30)]) {
    assert.doesNotThrow(() => validateAssociations([{ ...entries[0], instagram }]));
  }
  assert.throws(() => validateAssociations([{ ...entries[0], activa: 'true' }]));
  assert.throws(() => validateAssociations([{ ...entries[0], carrera: ' ' }]));
  assert.throws(() => validateAssociations([{ ...entries[0], escuela_o_departamento: 123 }]));
  assert.doesNotThrow(() => validateAssociations([{ ...entries[0], escuela_o_departamento: '' }]));
  assert.throws(() => validateAssociations([entries[0], { ...entries[0] }]));
  assert.throws(() => validateAssociations({}));
  assert.doesNotThrow(() => validateAssociations([]));
});

test('el diagrama cubre todos los órganos con relaciones válidas', () => {
  const ids = content.organos.map(organ => organ.id);
  assert.equal(new Set(ids).size, 12);
  const represented = new Set();
  for (const view of content.mapa) {
    for (const group of view.grupos) {
      assert.ok(ids.includes(group.origen));
      represented.add(group.origen);
      assert.ok(group.destinos.length > 0);
      for (const destination of group.destinos) {
        assert.ok(ids.includes(destination) && destination !== group.origen);
        represented.add(destination);
      }
    }
  }
  assert.equal(represented.size, ids.length);
  assert.ok(!Object.hasOwn(content, 'presupuesto'));
  assert.ok(!Object.hasOwn(content, 'glosario'));
});

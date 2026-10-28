export const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CR');

export function associationId(entry) {
  return 'asociacion-' + normalize([entry.nombre, entry.carrera, entry.sede].join('-')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function validateAssociations(data) {
  if (!Array.isArray(data)) throw new Error('El directorio debe ser una lista JSON.');
  const ids = new Set();
  for (const [index, entry] of data.entries()) {
    const error = (message) => { throw new Error(`Entrada ${index + 1}: ${message}`); };
    if (!entry || typeof entry !== 'object') error('se esperaba un objeto.');
    for (const field of ['nombre', 'carrera', 'escuela_o_departamento', 'sede']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) error(`falta ${field}.`);
    }
    if (typeof entry.activa !== 'boolean') error('activa debe ser true o false.');
    if (typeof entry.instagram !== 'string' || (entry.instagram && !/^[a-zA-Z0-9_](?:[a-zA-Z0-9_.]{0,28}[a-zA-Z0-9_])?$/.test(entry.instagram))) error('instagram debe ser un usuario sin @ ni URL, o una cadena vacía.');
    if (entry.descripcion !== undefined && typeof entry.descripcion !== 'string') error('descripcion debe ser texto.');
    if (entry.junta !== undefined && (!Array.isArray(entry.junta) || entry.junta.some(member => typeof member !== 'string'))) error('junta debe ser una lista de textos.');
    if (entry.color !== undefined && !/^#[a-fA-F0-9]{6}$/.test(entry.color)) error('color debe usar #RRGGBB.');
    const id = associationId(entry);
    if (ids.has(id)) error('hay dos asociaciones con el mismo nombre, carrera y sede.');
    ids.add(id);
  }
  return data;
}

export function filterAssociations(data, { search = '', sede = '' } = {}) {
  const words = normalize(search.trim()).split(/\s+/).filter(Boolean);
  return data.filter(entry => (!sede || entry.sede === sede) && words.every(word => normalize([entry.nombre, entry.carrera, entry.escuela_o_departamento, entry.sede].join(' ')).includes(word)));
}

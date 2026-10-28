import { associationId, filterAssociations, validateAssociations } from './directory.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const paragraph = text => `<p>${escape(text)}</p>`;
let content;
let associations = [];
let selectedOrgan = 'ce';
let mapView = 'elecciones';
let directoryView = 'all';

async function readJSON(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function updateTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  $('#theme-toggle').setAttribute('aria-pressed', String(dark));
  $('meta[name="theme-color"]').content = dark ? '#151e26' : '#ffffff';
}
updateTheme();
$('#theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('movimiento-theme', next); } catch { /* El tema sigue activo sin almacenamiento. */ }
  updateTheme();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  let saved;
  try { saved = localStorage.getItem('movimiento-theme'); } catch { /* Usar el tema del sistema. */ }
  if (!saved) {
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    updateTheme();
  }
});

const organById = id => content.organos.find(organ => organ.id === id);
const viewContains = (view, id) => view.grupos.some(group => group.origen === id || group.destinos.includes(id));
const node = id => `<button type="button" class="map-node" data-organ="${id}" aria-pressed="false">${escape(organById(id).corto)}</button>`;

function renderDiagram() {
  const view = content.mapa.find(item => item.id === mapView);
  document.querySelectorAll('[data-map-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapView === mapView)));
  $('#diagram').innerHTML = view.grupos.map(group => `<div class="flow-group" role="group" aria-label="${escape(organById(group.origen).corto + ': ' + group.accion)}"><svg class="flow-lines" aria-hidden="true"></svg><div class="flow-source">${node(group.origen)}</div><p class="flow-action">${escape(group.accion)}</p><div class="flow-targets" style="--targets:${group.destinos.length}">${group.destinos.map(node).join('')}</div></div>`).join('');
  requestAnimationFrame(drawConnections);
}

function selectOrgan(id) {
  const organ = organById(id);
  if (!organ) return;
  selectedOrgan = id;
  if (!viewContains(content.mapa.find(view => view.id === mapView), id)) {
    mapView = content.mapa.find(view => viewContains(view, id)).id;
    renderDiagram();
  }
  document.querySelectorAll('[data-organ]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.organ === id)));
  $('#organ-detail').innerHTML = `<div class="organ-summary"><h3>${escape(organ.nombre)}${organ.sigla ? ` <span class="organ-acronym">(${escape(organ.sigla)})</span>` : ''}</h3>${paragraph(organ.rol)}<details class="organ-meta"><summary>Composición y periodo</summary><p>${escape(organ.integrantes)}</p><p>${escape(organ.periodo)}</p></details></div><ul class="organ-powers">${organ.poderes.map(power => `<li>${escape(power)}</li>`).join('')}</ul>`;
}

function drawConnections() {
  document.querySelectorAll('.flow-group').forEach((group, index) => {
    const rect = group.getBoundingClientRect();
    const from = group.querySelector('.flow-source button').getBoundingClientRect();
    const svg = group.querySelector('svg');
    const targets = [...group.querySelectorAll('.flow-targets button')].map(button => button.getBoundingClientRect());
    const x = from.left - rect.left + from.width / 2;
    const y = from.bottom - rect.top;
    const branch = (y + targets[0].top - rect.top) / 2;
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    const wrapped = targets.some(to => to.top > targets[0].top + 1);
    svg.innerHTML = `<defs><marker id="arrow-${index}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z"/></marker></defs>` + targets.map(to => {
      let path = `M${x} ${y}V${branch}H${to.left - rect.left + to.width / 2}V${to.top - rect.top - 5}`;
      if (wrapped) {
        const side = to.left + to.width / 2 < rect.left + rect.width / 2 ? -1 : 1;
        const edge = (side < 0 ? to.left : to.right) - rect.left;
        path = `M${x} ${y}V${branch}H${edge + side * 9}V${to.top - rect.top + to.height / 2}H${edge + side * 5}`;
      }
      return `<path class="connection" d="${path}" marker-end="url(#arrow-${index})"/>`;
    }).join('');
  });
}

function renderContent(data) {
  const ids = new Set(data.organos.map(organ => organ.id));
  if (ids.size !== data.organos.length || data.organos.some(organ => !/^[a-z]+$/.test(organ.id))) throw new Error('Identificadores de órganos inválidos.');
  if (data.mapa.some(view => !/^[a-z]+$/.test(view.id) || view.grupos.some(group => !ids.has(group.origen) || !group.destinos.length || group.destinos.some(id => !ids.has(id) || id === group.origen)))) throw new Error('Relaciones del diagrama inválidas.');
  if (data.organos.some(organ => !data.mapa.some(view => viewContains(view, organ.id)))) throw new Error('Hay órganos sin representación en el diagrama.');
  content = data;
  $('#hero-description').textContent = data.descripcion;
  $('#map-views').innerHTML = data.mapa.map(view => `<button type="button" data-map-view="${view.id}" aria-pressed="false">${escape(view.nombre)}</button>`).join('');
  $('#map-views').addEventListener('click', event => {
    const button = event.target.closest('[data-map-view]');
    if (!button) return;
    mapView = button.dataset.mapView;
    const view = data.mapa.find(item => item.id === mapView);
    renderDiagram();
    selectOrgan(viewContains(view, selectedOrgan) ? selectedOrgan : view.grupos[0].origen);
  });
  $('#organ-index').innerHTML = data.organos.map(organ => `<div>${node(organ.id)}<span>${escape(organ.rol)}</span></div>`).join('');
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-organ]');
    if (!button) return;
    selectOrgan(button.dataset.organ);
    if (button.closest('#organ-index')) {
      $('#organ-detail').scrollIntoView({ block: 'center' });
      $('#organ-detail').focus({ preventScroll: true });
    }
  });
  $('#organ-detail').tabIndex = -1;
  renderDiagram();
  selectOrgan(selectedOrgan);
  new ResizeObserver(drawConnections).observe($('#diagram'));
  $('#campus-profiles').innerHTML = data.federacion_por_sede.map(profile => `<li><a href="https://instagram.com/${encodeURIComponent(profile.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de la Federación en ${escape(profile.sede)} (nueva pestaña)">${escape(profile.sede)}</a></li>`).join('');
  $('#load-status').hidden = true;
  handleHash();
}

function associationCard(entry) {
  const id = associationId(entry);
  const example = entry.nombre.startsWith('EJEMPLO');
  return `<article id="${id}" class="association-card" tabindex="-1" aria-labelledby="${id}-title"><div class="association-topline"><span>${escape(entry.sede)}</span><span>${example ? '<span class="example-label">EJEMPLO</span>' : ''}${!entry.activa ? ' · Inactiva' : ''}</span></div><h3 id="${id}-title">${escape(entry.nombre.replace(/^EJEMPLO\s*[·:]\s*/, ''))}</h3><p class="association-career">${escape(entry.carrera)}</p>${entry.instagram ? `<a class="button instagram-action" href="https://instagram.com/${encodeURIComponent(entry.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram de ${escape(entry.nombre)} (nueva pestaña)">Abrir Instagram</a>` : '<button type="button" class="button instagram-action" disabled>Instagram sin registrar</button>'}<details><summary>Más información</summary>${entry.escuela_o_departamento ? paragraph(entry.escuela_o_departamento) : ''}${entry.descripcion ? paragraph(entry.descripcion) : ''}<a class="permalink" href="#${id}">Enlace a esta asociación</a></details></article>`;
}

function renderDirectory() {
  const filtered = filterAssociations(associations, { search: $('#search').value, sede: $('#sede').value });
  $('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'asociación' : 'asociaciones'}`;
  $('#reset-filters').hidden = !($('#search').value || $('#sede').value);
  $('#directory-status').textContent = !associations.length ? 'Todavía no hay asociaciones registradas.' : !filtered.length ? 'No hay coincidencias. Probá otra búsqueda o limpiá los filtros.' : '';
  if (directoryView === 'all') {
    $('#directory-results').innerHTML = `<div class="association-grid">${filtered.map(associationCard).join('')}</div>`;
    return;
  }
  const sites = [...new Set(filtered.map(entry => entry.sede))].sort((a, b) => a.localeCompare(b, 'es'));
  $('#directory-results').innerHTML = sites.map(site => {
    const entries = filtered.filter(entry => entry.sede === site);
    return `<section class="association-group" aria-label="Sede ${escape(site)}"><h3>${escape(site)}</h3><div class="association-grid">${entries.map(associationCard).join('')}</div></section>`;
  }).join('');
}

function resetFilters() {
  $('#directory-filters').reset();
  renderDirectory();
}

function setupDirectory(data) {
  associations = validateAssociations(data);
  for (const value of [...new Set(associations.map(entry => entry.sede))].sort((a, b) => a.localeCompare(b, 'es'))) {
    $('#sede').add(new Option(value, value));
  }
  $('#directory-filters').addEventListener('submit', event => event.preventDefault());
  $('#search').addEventListener('input', renderDirectory);
  $('#sede').addEventListener('change', renderDirectory);
  $('#reset-filters').addEventListener('click', () => { resetFilters(); $('#search').focus(); });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    directoryView = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderDirectory();
  }));
  renderDirectory();
  handleHash();
}

function handleHash() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (id.startsWith('asociacion-') && associations.some(entry => associationId(entry) === id)) {
    if (!document.getElementById(id)) resetFilters();
    const card = document.getElementById(id);
    card.querySelector('details').open = true;
    requestAnimationFrame(() => { card.scrollIntoView({ block: 'center' }); card.focus({ preventScroll: true }); });
  }
  if (id.startsWith('organo-') && content && organById(id.slice(7))) {
    selectOrgan(id.slice(7));
    requestAnimationFrame(() => { $('#organ-detail').scrollIntoView({ block: 'center' }); $('#organ-detail').focus({ preventScroll: true }); });
  }
}
window.addEventListener('hashchange', handleHash);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link && link.hash === location.hash) handleHash();
});

const navLinks = [...document.querySelectorAll('.mini-nav a')];
let navPending = false;
function updateCurrentSection() {
  navPending = false;
  const threshold = $('.site-header').getBoundingClientRect().height + 48;
  const atBottom = window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  const current = atBottom ? navLinks.at(-1) : [...navLinks].reverse().find(link => $(link.hash).getBoundingClientRect().top <= threshold) || navLinks[0];
  navLinks.forEach(link => {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!navPending) { navPending = true; requestAnimationFrame(updateCurrentSection); }
}, { passive: true });
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--nav-height', `${$('.site-header').getBoundingClientRect().height + 16}px`);
  requestAnimationFrame(updateCurrentSection);
}).observe($('.site-header'));

await Promise.allSettled([
  readJSON('../../data/contenido.json').then(renderContent).catch(error => {
    $('#load-status').textContent = 'No se pudo cargar la organización. Recargá la página.';
    $('#load-status').setAttribute('role', 'alert');
    console.error(error);
  }),
  readJSON('../../data/asociaciones.json').then(setupDirectory).catch(error => {
    $('#directory-status').textContent = 'No se pudo cargar el directorio. Recargá la página.';
    $('#directory-status').setAttribute('role', 'alert');
    $('#directory-filters').querySelectorAll('input, select').forEach(field => { field.disabled = true; });
    document.querySelectorAll('[data-view]').forEach(button => { button.disabled = true; });
    console.error(error);
  })
]);

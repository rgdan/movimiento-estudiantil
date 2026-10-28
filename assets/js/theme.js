(() => {
  let theme;
  try { theme = localStorage.getItem('movimiento-theme'); } catch { /* El tema del sistema funciona sin almacenamiento. */ }
  document.documentElement.dataset.theme = ['light', 'dark'].includes(theme) ? theme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();

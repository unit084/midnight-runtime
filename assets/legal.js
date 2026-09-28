(() => {
  let lang = 'pl';
  try { lang = localStorage.getItem('mr-lang') || ((navigator.language || '').toLowerCase().startsWith('pl') ? 'pl' : 'en'); } catch (e) {}
  const set = l => {
    lang = l === 'en' ? 'en' : 'pl';
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  };
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
    try { localStorage.setItem('mr-lang', b.dataset.lang); } catch (e) {}
    set(b.dataset.lang);
  }));
  set(lang);
})();

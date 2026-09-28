/* Midnight Runtime — landing page logic (no external services, no cookies) */
(() => {
'use strict';

/* ====== CONTENT ======
   Mixes come from data/videos.json (updated automatically from YouTube)
   and data/upcoming.json (announced premieres, hidden automatically after they start).
   Albums come from data/albums.json. Site links: data/site.json.
   Adding content = editing those files; this script stays untouched. */
const HERO_MS = 9000;
const HERO = [
  { src: 'assets/video/loop-001.mp4', poster: 'assets/scenes/operator-workstation.jpg', code: 'MR-VIS-001', en: 'Operator workstation', pl: 'Stanowisko operatora' },
  { src: 'assets/video/loop-009.mp4', poster: 'assets/scenes/night-bus.jpg', code: 'MR-VIS-009', en: 'Night bus', pl: 'Nocny autobus' },
  { src: 'assets/video/loop-010.mp4', poster: 'assets/scenes/harbor-lights.jpg', code: 'MR-VIS-010', en: 'Harbor lights', pl: 'Światła portu' },
  { src: 'assets/video/loop-012.mp4', poster: 'assets/scenes/night-laundromat.jpg', code: 'MR-VIS-012', en: 'Night laundromat', pl: 'Nocna pralnia' }
];
const I18N = {
  en: {
    skip: 'Skip to content',
    heroKicker: 'MR // Dark electronic for deep work',
    heroLead: 'Dark electronic soundscapes engineered for coding and uninterrupted deep work.',
    heroBody: 'Instrumental soundscapes with steady energy—no vocals, no distractions. Enter The Night Grid.',
    ctaYt: 'Watch on YouTube', mixesTitle: 'Long mixes for long sessions', subscribe: 'Subscribe',
    tracks: 'tracks', premiere: 'Premiere', loadVideo: 'Play video', ytNotice: 'Playing loads the YouTube player (youtube-nocookie.com), which connects to Google.',
    openChannel: 'Open on YouTube',
    relKicker: 'Spotify & Apple Music', relTitle: 'Albums from the grid', album: 'Album',
    out: 'Planned release', rolling: 'Rolling out to Spotify, Apple Music & more', daysLeft: 'days',
    noSample: 'Sample coming soon', spotifySoon: 'Spotify link coming soon', openSpotify: 'Listen on Spotify', openApple: 'Apple Music', tracklist: 'Tracklist',
    channels: 'Channels', soon: 'soon', contact: 'Contact', legal: 'Legal', privacy: 'Privacy policy',
    disclosure: 'Music is created with permitted generative tools, then selected, arranged, mixed, and paired with original visual direction by a human curator.',
    nowPlaying: 'Now playing', mixesN: n => n + (n === 1 ? ' mix' : ' mixes'), albumsN: n => n + (n === 1 ? ' album' : ' albums'), upcoming: 'Upcoming', outNow: 'Out now'
  },
  pl: {
    skip: 'Przejdź do treści',
    heroKicker: 'MR // Mroczna elektronika do głębokiej pracy',
    heroLead: 'Mroczne elektroniczne pejzaże dźwiękowe do kodowania i nieprzerwanej, głębokiej pracy.',
    heroBody: 'Instrumentalnie, ze stałą energią — bez wokali, bez rozpraszaczy. Wejdź do The Night Grid.',
    ctaYt: 'Oglądaj na YouTube', mixesTitle: 'Długie miksy na długie sesje', subscribe: 'Subskrybuj',
    tracks: 'utworów', premiere: 'Premiera', loadVideo: 'Odtwórz film', ytNotice: 'Odtworzenie wczyta odtwarzacz YouTube (youtube-nocookie.com), który łączy się z Google.',
    openChannel: 'Otwórz na YouTube',
    relKicker: 'Spotify i Apple Music', relTitle: 'Albumy z siatki', album: 'Album',
    out: 'Planowana premiera', rolling: 'Właśnie trafia na Spotify, Apple Music i inne', daysLeft: 'dni',
    noSample: 'Próbka wkrótce', spotifySoon: 'Link do Spotify wkrótce', openSpotify: 'Słuchaj na Spotify', openApple: 'Apple Music', tracklist: 'Lista utworów',
    channels: 'Kanały', soon: 'wkrótce', contact: 'Kontakt', legal: 'Informacje prawne', privacy: 'Polityka prywatności',
    disclosure: 'Muzyka powstaje z użyciem dozwolonych narzędzi generatywnych, a następnie jest wybierana, układana, miksowana i łączona z autorskim kierunkiem wizualnym przez człowieka-kuratora.',
    nowPlaying: 'Teraz gra', mixesN: n => n + (n === 1 ? ' miks' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? ' miksy' : ' miksów')), albumsN: n => n + (n === 1 ? ' album' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? ' albumy' : ' albumów')), upcoming: 'Wkrótce', outNow: 'Już jest'
  }
};
/* ====== end of content ====== */

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const icon = (name, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ico' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-' + name); s.appendChild(u); return s; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
document.documentElement.classList.add('js');

let MIXES = [], RELEASES = [], SITE = { spotifyArtist: null, appleArtist: null };
const st = { lang: 'en', heroIdx: 0, mixIdx: 0, mixPlaying: false, relIdx: 0, track: null };
try { st.lang = localStorage.getItem('mr-lang') || ((navigator.language || '').toLowerCase().startsWith('pl') ? 'pl' : 'en'); } catch (e) {}
if (!I18N[st.lang]) st.lang = 'en';
const T = () => I18N[st.lang];
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString(st.lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: st.lang === 'pl' ? '2-digit' : 'short', year: 'numeric' });

/* ---------- language ---------- */
function applyLang() {
  document.documentElement.lang = st.lang;
  document.querySelectorAll('[data-i18n]').forEach(n => { const v = T()[n.dataset.i18n]; if (v != null) n.textContent = v; });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === st.lang)));
  $('mini').setAttribute('aria-label', T().nowPlaying);
  renderScene(); renderMixes(); renderAlbum(); renderFooter();
}
document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
  st.lang = b.dataset.lang; try { localStorage.setItem('mr-lang', st.lang); } catch (e) {} applyLang();
}));

/* ---------- hero ---------- */
const heroMedia = $('heroMedia'), bars = $('sceneBars');
const heroEls = HERO.map((h, i) => {
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.preload = i === 0 ? 'auto' : 'none'; v.poster = h.poster;
  if (i === 0) v.classList.add('on');
  heroMedia.appendChild(v);
  const b = el('button'); b.type = 'button'; const f = el('span', 'fill'); b.appendChild(f);
  b.addEventListener('click', () => goHero(i)); bars.appendChild(b);
  return { v, b, f };
});
let heroStart = performance.now(), mediaReady = false;
function playHero() {
  heroEls.forEach((h, i) => {
    if (i === st.heroIdx) {
      if (mediaReady && !h.v.getAttribute('src')) h.v.src = HERO[i].src;
      if (mediaReady && !reduced) { try { h.v.currentTime = 0; } catch (e) {} h.v.play().catch(() => {}); }
    } else h.v.pause();
  });
}
function goHero(i) {
  heroStart = performance.now();
  heroEls.forEach((h, j) => { h.v.classList.toggle('on', j === i); h.f.style.width = j < i ? '100%' : '0%'; });
  st.heroIdx = i; renderScene(); playHero();
}
function renderScene() {
  $('sceneCode').textContent = HERO[st.heroIdx].code;
  $('sceneName').textContent = HERO[st.heroIdx][st.lang];
  heroEls.forEach((h, i) => h.b.setAttribute('aria-label', HERO[i][st.lang]));
}
// heavy video only after images, so it never starves the page
const startMedia = () => { if (mediaReady) return; mediaReady = true; playHero(); };
addEventListener('load', () => setTimeout(startMedia, 300));
setTimeout(startMedia, 8000);

function scramble(node, text, delay) {
  if (!node || reduced) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let f = 0; const total = text.length * 4 + 16;
  setTimeout(() => { const step = () => { let o = ''; for (let i = 0; i < text.length; i++) o += f > i * 4 + 12 ? text[i] : chars[(Math.random() * chars.length) | 0]; node.textContent = o; if (f++ < total) requestAnimationFrame(step); else node.textContent = text; }; step(); }, delay);
}
scramble($('tA'), 'MIDNIGHT', 250); scramble($('tB'), 'RUNTIME', 650);

let cursorEl = null;
(function typeTerminal() {
  const box = $('term'), lines = [['$ ', 'runtime --mode deep_focus'], ['> ', 'scene: night_grid · signal: steady · bpm: locked'], ['> ', 'vocals 0 · drops 0 · distractions 0'], ['> ', 'ready']];
  let li = 0, ci = 0, row = null;
  const tick = () => {
    if (li >= lines.length) { cursorEl = el('span', 'cur', '▍'); row.appendChild(cursorEl); return; }
    if (ci === 0) { row = el('div'); row.appendChild(el('span', 'p', lines[li][0])); row.appendChild(el('span', li === lines.length - 1 ? 'last' : '')); box.appendChild(row); }
    const txt = lines[li][1]; row.lastChild.textContent = txt.slice(0, ++ci);
    if (ci >= txt.length) { li++; ci = 0; setTimeout(tick, reduced ? 0 : 380); } else setTimeout(tick, reduced ? 0 : 18 + Math.random() * 30);
  };
  setTimeout(tick, reduced ? 0 : 1300);
})();

/* ---------- data ---------- */
const getJSON = url => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).catch(() => []);
const shortName = t => { const parts = String(t).split('|').map(x => x.trim()); const p = parts.find(x => !/music/i.test(x)) || parts[parts.length - 1]; return p.replace(/\(?\b\d{2,3}\s*-?\s*min(ute)?s?\)?/ig, '').replace(/\s{2,}/g, ' ').trim(); };
function buildMixes(videos, upcoming) {
  const now = Date.now();
  const up = (upcoming || []).filter(u => u.premiere && new Date(u.premiere).getTime() > now)
    .map(u => ({ ...u, yt: null, date: u.premiere.slice(0, 10), prem: true }));
  const vids = (videos || []).filter(v => /^[A-Za-z0-9_-]{11}$/.test(v.id)).map(v => ({
    yt: v.id, title: v.title, name: v.name || shortName(v.title), min: v.min, tracks: v.tracks, date: v.date,
    thumb: v.thumb || `assets/thumbs/yt/${v.id}.jpg`
  })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const all = up.concat(vids);
  const n = all.length;
  all.forEach((m, i) => { m.code = String(n - i).padStart(3, '0'); });
  return all;
}

/* ---------- marquee ---------- */
const mq = $('marquee');
function buildMarquee() {
  mq.textContent = '';
  const all = RELEASES.flatMap(r => r.tracks || []);
  for (let k = 0; k < 2; k++) all.forEach((x, j) => { const s = el('span'); s.appendChild(el('span', j % 7 === 0 ? 'hl' : '', x)); s.appendChild(el('span', 'sep', '//')); mq.appendChild(s); });
}

/* ---------- rails (carousels) ---------- */
function updateRailNav(id) {
  const r = $(id); if (!r) return;
  document.querySelectorAll(`.rn[data-rail="${id}"]`).forEach(b => {
    const dir = +b.dataset.dir;
    b.disabled = dir < 0 ? r.scrollLeft <= 2 : r.scrollLeft + r.clientWidth >= r.scrollWidth - 2;
  });
}
document.querySelectorAll('.rn').forEach(b => b.addEventListener('click', () => {
  const r = $(b.dataset.rail); r.scrollBy({ left: +b.dataset.dir * Math.max(240, r.clientWidth * .8), behavior: reduced ? 'auto' : 'smooth' });
}));
['mixRail', 'albRail'].forEach(id => { const r = $(id); r.addEventListener('scroll', () => updateRailNav(id), { passive: true }); addEventListener('resize', () => updateRailNav(id)); });

/* ---------- mixes ---------- */
function mixMeta(m, t) { return [m.min ? `${m.min} min` : '', m.tracks ? `${m.tracks} ${t.tracks}` : ''].filter(Boolean).join(' · '); }
function renderMixes() {
  const t = T(), list = $('mixRail'); list.textContent = '';
  $('mixCount').textContent = t.mixesN(MIXES.length);
  MIXES.forEach((m, i) => {
    const li = el('li'), b = el('button', 'card'); b.type = 'button';
    b.setAttribute('aria-current', String(i === st.mixIdx));
    const th = el('span', 'th'); const im = el('img'); im.src = m.thumb; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im); th.appendChild(icon('yt'));
    const stt = el('span', 'st'); stt.appendChild(el('span', m.prem ? 'dot red' : 'dot'));
    stt.appendChild(document.createTextNode(m.prem ? `${t.premiere} ${fmtDate(m.date)} · ${new Date(m.premiere).toLocaleTimeString(st.lang === 'pl' ? 'pl-PL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}` : fmtDate(m.date)));
    b.append(th, el('span', 'code', 'MR // ' + m.code), el('span', 'nm', m.name), el('span', 'mt', mixMeta(m, t)), stt);
    b.addEventListener('click', () => { st.mixIdx = i; st.mixPlaying = false; renderMixes(); $('player').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); });
    li.appendChild(b); list.appendChild(li);
  });
  renderPlayer(); updateRailNav('mixRail');
}
function renderPlayer() {
  const t = T(), m = MIXES[st.mixIdx], p = $('player'); p.textContent = '';
  if (!m) { $('mixCode').textContent = ''; $('mixTitle').textContent = ''; return; }
  if (m.yt && st.mixPlaying) {
    const f = el('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.yt)}?autoplay=1&rel=0&playsinline=1`;
    f.title = m.title; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.referrerPolicy = 'strict-origin-when-cross-origin'; f.allowFullscreen = true;
    p.appendChild(f);
  } else {
    const im = el('img'); im.src = m.thumb; im.alt = m.title; p.appendChild(im); p.appendChild(el('div', 'fade'));
    const c = el('div', 'ctrl');
    if (m.yt) {
      const b = el('button', 'btn pri glass'); b.type = 'button'; b.appendChild(icon('yt')); b.appendChild(document.createTextNode(t.loadVideo));
      b.addEventListener('click', () => { st.mixPlaying = true; renderPlayer(); });
      c.append(b, el('span', 'note', t.ytNotice));
    } else {
      const a = el('a', 'btn pri glass'); a.href = (SITE.youtube || 'https://www.youtube.com/@Midnight.Runtime') + '/videos'; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(icon('yt')); a.appendChild(document.createTextNode(t.openChannel)); c.appendChild(a);
    }
    p.appendChild(c);
  }
  $('mixCode').textContent = 'MR // ' + m.code; $('mixTitle').textContent = m.title;
  $('mixLink').href = m.yt ? `https://www.youtube.com/watch?v=${encodeURIComponent(m.yt)}` : 'https://www.youtube.com/@Midnight.Runtime/videos';
}

/* ---------- albums ---------- */
const cover = $('cover'), shine = $('shine');
let coverImgs = [];
function buildAlbums() {
  coverImgs.forEach(im => im.remove());
  coverImgs = RELEASES.map((r, i) => { const im = el('img'); im.src = r.cover; im.alt = r.title + ' — cover'; im.decoding = 'async'; if (i !== st.relIdx) im.loading = 'lazy'; cover.insertBefore(im, shine); return im; });
}
function albStatus(R, t) {
  const days = Math.ceil((new Date(R.release + 'T00:00:00').getTime() - Date.now()) / 864e5);
  if (R.spotify) return { when: t.outNow, days: '', live: true };
  if (days > 0) return { when: `${t.out}: ${fmtDate(R.release)}`, days: `T–${days} ${t.daysLeft}`, live: false };
  return { when: t.rolling, days: '', live: true };
}
function renderAlbum() {
  const t = T(), R = RELEASES[st.relIdx]; if (!R) return;
  coverImgs.forEach((im, i) => im.classList.toggle('on', i === st.relIdx));
  const n = RELEASES.length;
  $('albCountAll').textContent = t.albumsN(n);
  $('albKind').textContent = `${t.album} · MR // ${String(n - st.relIdx).padStart(3, '0')}`;
  $('albTitle').textContent = R.title.toUpperCase();
  $('albMeta').textContent = `${R.tracks.length} ${t.tracks}` + (R.min ? ` · ~${R.min} min` : '');
  const s = albStatus(R, t); $('albWhen').textContent = s.when; $('albDays').textContent = s.days;
  $('albCount').textContent = String(R.tracks.length).padStart(2, '0');
  const ol = $('albTracks'); ol.textContent = '';
  R.tracks.forEach((x, j) => { const li = el('li'); li.append(el('span', 'n', String(j + 1).padStart(2, '0')), document.createTextNode(x)); ol.appendChild(li); });
  const acts = $('albActions'); acts.textContent = '';
  (R.samples || []).forEach((smp, j) => {
    const key = st.relIdx + ':' + j, on = st.track === key;
    const b = el('button', 'btn small sample' + (on ? ' on' : '')); b.type = 'button';
    b.appendChild(icon(on && audio && !audio.paused ? 'pause' : 'play')); b.appendChild(document.createTextNode(smp.title));
    b.addEventListener('click', () => playSample(st.relIdx, j)); acts.appendChild(b);
  });
  if (!(R.samples || []).length) { const x = el('span', 'nosample'); x.appendChild(icon('wave')); x.appendChild(document.createTextNode(t.noSample)); acts.appendChild(x); }
  const sp = R.spotify || null;
  if (sp) { const a = el('a', 'btn small'); a.href = sp; a.target = '_blank'; a.rel = 'noopener'; a.appendChild(icon('sp')); a.appendChild(document.createTextNode(t.openSpotify)); acts.appendChild(a); }
  else { const x = el('span', 'btn small'); x.setAttribute('aria-disabled', 'true'); x.appendChild(icon('sp')); x.appendChild(document.createTextNode(t.spotifySoon)); acts.appendChild(x); }
  if (R.apple) { const a = el('a', 'btn small'); a.href = R.apple; a.target = '_blank'; a.rel = 'noopener'; a.appendChild(icon('ap')); a.appendChild(document.createTextNode(t.openApple)); acts.appendChild(a); }
  // rail
  const rail = $('albRail'); rail.textContent = '';
  RELEASES.forEach((r, i) => {
    const li = el('li'), b = el('button', 'card'); b.type = 'button'; b.setAttribute('aria-current', String(i === st.relIdx));
    const th = el('span', 'th sq'); const im = el('img'); im.src = r.cover; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im);
    const rs = albStatus(r, t), stt = el('span', 'st'); stt.appendChild(el('span', rs.live ? 'dot' : 'dot dim')); stt.appendChild(document.createTextNode(rs.live ? (r.spotify ? t.outNow : fmtDate(r.release)) : `${t.upcoming} · ${fmtDate(r.release)}`));
    b.append(th, el('span', 'code', 'MR // ' + String(n - i).padStart(3, '0')), el('span', 'nm', r.title), el('span', 'mt', `${r.tracks.length} ${t.tracks}` + (r.min ? ` · ~${r.min} min` : '')), stt);
    b.addEventListener('click', () => { st.relIdx = i; renderAlbum(); cover.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); });
    li.appendChild(b); rail.appendChild(li);
  });
  updateRailNav('albRail');
}
cover.addEventListener('mousemove', e => {
  if (reduced) return;
  const b = cover.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
  cover.style.transition = 'transform .12s linear'; cover.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  shine.style.opacity = 1; shine.style.background = `radial-gradient(circle at ${(x + .5) * 100}% ${(y + .5) * 100}%, rgba(102,227,244,.22), transparent 55%)`;
});
cover.addEventListener('mouseleave', () => { cover.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)'; cover.style.transform = 'none'; shine.style.opacity = 0; });

function renderFooter() {
  const box = $('footSpotify');
  if (SITE.spotifyArtist && box.tagName !== 'A') { const a = el('a'); a.href = SITE.spotifyArtist; a.target = '_blank'; a.rel = 'noopener'; a.id = 'footSpotify'; a.appendChild(icon('sp')); a.appendChild(document.createTextNode('Spotify')); box.replaceWith(a); }
  const ab = $('footApple');
  if (SITE.appleArtist && ab && ab.tagName !== 'A') { const a = el('a'); a.href = SITE.appleArtist; a.target = '_blank'; a.rel = 'noopener'; a.id = 'footApple'; a.appendChild(icon('ap')); a.appendChild(document.createTextNode('Apple Music')); ab.replaceWith(a); }
  const ext = (sel, url) => { if (url) document.querySelectorAll(sel).forEach(x => { x.href = url; x.target = '_blank'; x.rel = 'noopener'; }); };
  ext('[data-sp]', SITE.spotifyArtist); ext('[data-ap]', SITE.appleArtist);
}

/* ---------- audio sample + visualiser ---------- */
let audio = null, actx = null, analyser = null, freq = null, level = 0;
const mini = $('mini');
function fmtT(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function setPP() { $('miniPP').replaceChildren(icon(audio && !audio.paused ? 'pause' : 'play')); renderAlbum(); }
function playSample(ri, si) {
  const key = ri + ':' + si;
  if (st.track === key && audio) { audio.paused ? audio.play() : audio.pause(); return; }
  const s = RELEASES[ri].samples[si];
  if (!audio) {
    audio = new Audio(); audio.preload = 'auto';
    audio.addEventListener('timeupdate', () => { if (!audio.duration) return; $('miniProg').style.width = (audio.currentTime / audio.duration * 100) + '%'; $('miniTime').textContent = fmtT(audio.currentTime); });
    ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, setPP));
    try {
      const AC = window.AudioContext || window.webkitAudioContext; actx = new AC();
      const src = actx.createMediaElementSource(audio); analyser = actx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = .8;
      freq = new Uint8Array(analyser.frequencyBinCount); src.connect(analyser); analyser.connect(actx.destination);
    } catch (e) { analyser = null; }
  }
  if (actx) actx.resume();
  st.track = key; audio.src = s.src; audio.play().catch(() => {});
  $('miniTitle').textContent = s.title; $('miniCover').src = RELEASES[ri].cover; $('miniTime').textContent = '0:00';
  mini.hidden = false; renderAlbum();
}
$('miniPP').addEventListener('click', () => { if (audio) audio.paused ? audio.play() : audio.pause(); });
$('miniX').addEventListener('click', () => { if (audio) audio.pause(); st.track = null; mini.hidden = true; renderAlbum(); });
const viz = $('viz'), vctx = viz.getContext('2d');
function drawViz() {
  const W = viz.width, H = viz.height, n = 16, bw = W / n; vctx.clearRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const v = freq[2 + i * 3] / 255, bh = Math.max(3, v * H); vctx.fillStyle = `rgba(102,227,244,${.35 + v * .65})`; vctx.fillRect(i * bw + 2, (H - bh) / 2, bw - 4, bh); }
}

/* ---------- reveal ---------- */
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((n, i) => { n.style.transitionDelay = ((i % 4) * 70) + 'ms'; io.observe(n); });
} else document.querySelectorAll('[data-reveal]').forEach(n => n.classList.add('in'));

/* ---------- pointer glow, ring, grid canvas ---------- */
const glow = $('glow'), ring = $('ring'), nav = $('nav'), heroContent = $('heroContent'), footWord = $('footWord');
const mouse = { x: -999, y: -999, tx: -999, ty: -999 };
if (fine) {
  addEventListener('pointermove', e => { mouse.tx = e.clientX; mouse.ty = e.clientY; ring.style.opacity = 1; ring.classList.toggle('hot', !!(e.target.closest && e.target.closest('a,button'))); });
  document.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -999; ring.style.opacity = 0; });
}
const canvas = $('grid'), ctx = canvas.getContext('2d'), G = 42;
let W = 0, H = 0, dpr = 1, packets = [], lastPar = null, footTop = 0;
function layout() {
  dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pt = footWord.style.transform; footWord.style.transform = 'none'; footTop = footWord.getBoundingClientRect().top + scrollY; footWord.style.transform = pt;
}
addEventListener('resize', layout); layout();
document.fonts && document.fonts.ready.then(layout);
function spawn(x, y, dir) {
  const par = scrollY * .25, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const col = x != null ? Math.round((x - G / 2) / G) : (Math.random() * (W / G)) | 0;
  const row = y != null ? Math.round((y + par) / G) : Math.floor((par + Math.random() * H) / G);
  packets.push({ x: G / 2 + col * G, y: row * G, d: dir || dirs[(Math.random() * 4) | 0], v: .8 + Math.random() * 1.6, trail: [], life: 240 + Math.random() * 420, age: 0, dist: 0, violet: Math.random() < .08 });
}
addEventListener('pointerdown', e => { if (!reduced) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => spawn(e.clientX, e.clientY, d)); });

function drawGrid(sy) {
  const lv = level; ctx.clearRect(0, 0, W, H);
  const par = sy * .25, R = 190, R2 = R * R;
  for (let row = Math.floor(par / G); row * G - par < H + G; row++) {
    const y = row * G - par;
    for (let x = G / 2; x < W; x += G) {
      const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy; let a = .07 + lv * .1, r = 1.2;
      if (d2 < R2) { const k = 1 - Math.sqrt(d2) / R; a += k * k * .75; r += k * 1.8; }
      ctx.fillStyle = `rgba(102,227,244,${a.toFixed(3)})`; ctx.fillRect(x - r / 2, y - r / 2, r, r);
    }
  }
  const dPar = par - (lastPar ?? par); lastPar = par;
  if (dPar) packets.forEach(p => p.trail.forEach(pt => pt[1] -= dPar));
  const target = reduced ? 4 : Math.round(12 + lv * 26);
  while (packets.length < target) spawn();
  ctx.lineCap = 'round';
  packets = packets.filter(p => {
    const sp = p.v * (1 + lv * 2.2); p.x += p.d[0] * sp; p.y += p.d[1] * sp; p.dist += sp; p.age++;
    if (p.dist >= G) { p.dist -= G; p.x = G / 2 + Math.round((p.x - G / 2) / G) * G; p.y = Math.round(p.y / G) * G; if (Math.random() < .28) p.d = p.d[0] ? [0, Math.random() < .5 ? 1 : -1] : [Math.random() < .5 ? 1 : -1, 0]; }
    const syp = p.y - par; p.trail.push([p.x, syp]); if (p.trail.length > 26) p.trail.shift();
    const fade = Math.min(1, p.age / 30, (p.life - p.age) / 40), col = p.violet ? '124,77,255' : '102,227,244';
    if (p.trail.length > 1) { ctx.strokeStyle = `rgba(${col},${(.35 * fade).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.trail[0][0], p.trail[0][1]); for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i][0], p.trail[i][1]); ctx.stroke(); }
    ctx.fillStyle = `rgba(${col},${(.25 * fade).toFixed(3)})`; ctx.fillRect(p.x - 4, syp - 4, 8, 8);
    ctx.fillStyle = `rgba(230,247,250,${(.9 * fade).toFixed(3)})`; ctx.fillRect(p.x - 1.5, syp - 1.5, 3, 3);
    const dx = p.x - mouse.x, dy = syp - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 220) { ctx.strokeStyle = `rgba(102,227,244,${((1 - d / 220) * .4 * fade).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, syp); ctx.stroke(); }
    return p.age < p.life && syp > -80 && syp < H + 80 && p.x > -80 && p.x < W + 80;
  });
}

/* ---------- main loop ---------- */
let marqueeX = 0, lastScroll = 0, navOn = null;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  const sy = scrollY, ih = innerHeight;
  mouse.x += (mouse.tx - mouse.x) * .2; mouse.y += (mouse.ty - mouse.y) * .2;
  if (mouse.tx < -500) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
  glow.style.transform = `translate3d(${mouse.x}px,${mouse.y}px,0) scale(${1 + level * .5})`;
  ring.style.transform = `translate3d(${mouse.tx}px,${mouse.ty}px,0)`;
  if (analyser && audio && !audio.paused) { analyser.getByteFrequencyData(freq); let s = 0; for (let i = 0; i < 32; i++) s += freq[i]; level += ((s / 32 / 255) - level) * .2; drawViz(); } else level *= .95;
  const on = sy > 40; if (on !== navOn) { navOn = on; nav.classList.toggle('on', on); }
  if (!reduced && sy < ih * 1.2) {
    heroContent.style.transform = `translate3d(0,${sy * .28}px,0)`; heroContent.style.opacity = Math.max(0, 1 - sy / (ih * .75));
    heroMedia.style.transform = `scale(${1.04 + sy * .00018}) translate3d(0,${sy * .12}px,0)`;
  }
  const vel = sy - lastScroll; lastScroll = sy;
  if (!reduced) { marqueeX -= .45 + level * 2 + Math.min(12, Math.abs(vel) * .25); const half = mq.scrollWidth / 2; if (-marqueeX > half) marqueeX += half; mq.style.transform = `translate3d(${marqueeX}px,0,0)`; }
  const hp = Math.min(1, (now - heroStart) / HERO_MS);
  if (sy < ih) heroEls[st.heroIdx].f.style.width = (hp * 100) + '%';
  if (hp >= 1 && sy < ih) goHero((st.heroIdx + 1) % HERO.length); else if (hp >= 1) heroStart = now - HERO_MS;
  if (footTop) { const bt = footTop - sy; if (bt < ih) footWord.style.transform = `translate3d(${(bt - ih) * .15}px,0,0)`; }
  if (cursorEl) cursorEl.style.opacity = Math.floor(now / 530) % 2 ? 0 : 1;
  drawGrid(sy);
}
applyLang();
requestAnimationFrame(loop);
Promise.all([getJSON('data/videos.json'), getJSON('data/upcoming.json'), getJSON('data/albums.json'), fetch('data/site.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))]).then(([v, u, a, site]) => {
  SITE = Object.assign(SITE, site || {});
  MIXES = buildMixes(v, u);
  st.mixIdx = Math.max(0, MIXES.findIndex(m => m.yt));
  RELEASES = (Array.isArray(a) ? a : []).filter(r => r && r.title && Array.isArray(r.tracks)).sort((x, y) => String(y.release).localeCompare(String(x.release)));
  const firstOut = RELEASES.findIndex(r => r.spotify || new Date(r.release + 'T00:00:00').getTime() <= Date.now());
  st.relIdx = firstOut >= 0 ? firstOut : 0;
  buildMarquee(); buildAlbums(); applyLang();
  requestAnimationFrame(() => { layout(); document.querySelectorAll('[data-reveal]:not(.in)').forEach(n => { if (n.getBoundingClientRect().top < innerHeight) n.classList.add('in'); }); });
});
})();

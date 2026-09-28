# Midnight Runtime — strona

Statyczna strona (HTML/CSS/JS, bez frameworków), hostowana na GitHub Pages.

## Treść bez grzebania w kodzie
- `data/videos.json` — filmy z YouTube. **Aktualizuje się samo** co 6 h (automat w `.github/workflows/site.yml` czyta publiczny kanał RSS; Shortsy pomija). Ręcznie można dopisać `name` i `tracks`.
- `data/upcoming.json` — zapowiedziane premiery (znikają same po starcie premiery).
- `data/albums.json` — albumy (najnowszy u góry albo gdziekolwiek — strona sama sortuje po dacie `release`). Po wyjściu na Spotify wpisz link w `spotify`.
- `data/site.json` — `spotifyArtist` (link do profilu artysty), YouTube, e-mail.

Każda zmiana w repozytorium publikuje stronę automatycznie (ok. 1 min).

## Bezpieczeństwo
- Brak zewnętrznych skryptów, fontów i trackerów; Content-Security-Policy w `<meta>`.
- YouTube (youtube-nocookie.com) ładuje się dopiero po kliknięciu.
- Żadnych sekretów w repozytorium — automat używa tylko publicznego RSS YouTube.

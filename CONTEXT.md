# NEXUS UI / NexusjUI — Contexto de sesión

**Última actualización:** 2026-07-18  
**Estado:** Publicado, usable, v0.1.0

---

## Qué es

Librería de frontend **futurista drop-in** (estilo Bootstrap del ~2060): menús flotantes, paneles glass/HUD, temas neón, transiciones 3D entre páginas, audio UI (tic al tipear), reproductor de video flotante (local + embeds).

Sin framework: **HTML + CSS + JS** puro. Pensada para enchufarse a cualquier sistema (intranet, Laravel, Django, PHP, estático, etc.).

---

## Ubicaciones

| Qué | Ruta / URL |
|-----|------------|
| Proyecto local | `/Users/jhalmarmolina/ZCodeProject/nexus-ui` |
| Repo GitHub | https://github.com/Jhalmarm/NexusjUI |
| SSH | `git@github.com:Jhalmarm/NexusjUI.git` |
| Demo Pages | https://jhalmarm.github.io/NexusjUI/ |
| Release | https://github.com/Jhalmarm/NexusjUI/releases/tag/v0.1.0 |
| Branch | `main` |

---

## Estructura

```
nexus-ui/  (repo NexusjUI)
├── index.html          # redirect → demo/ (GitHub Pages)
├── css/
│   ├── nexus.css       # entrypoint
│   ├── tokens.css      # design tokens + themes
│   ├── base.css
│   ├── effects.css     # scanlines, grid, glass, particles host
│   ├── components.css  # btn, card, form, modal, table…
│   ├── nav.css         # dock + side-nav flotante
│   ├── motion.css      # View Transitions 3D
│   └── video.css       # player inline + float glass
├── js/
│   └── nexus.js        # runtime (theme, motion, audio, video, toast, modal)
├── demo/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── systems.html
│   ├── media.html
│   └── components.html
├── README.md
├── LICENSE             # MIT
├── CONTEXT.md          # este archivo
└── .gitignore
```

---

## Features implementadas (v0.1.0)

1. **Design tokens + temas:** cyber (default), void, ice, ember (`data-nx-theme` / `NexusUI.setTheme`)
2. **FX ambiente:** `data-nx-fx="scanlines grid noise particles vignette"`
3. **Nav flotante:**
   - `.nx-dock` inferior
   - `.nx-side-nav` lateral — centrado en banda topbar↔dock, responsive, no se oculta al resize
4. **Transiciones de página:** portal, fade-depth, cube, flip, glitch (View Transitions + fallback CSS)
5. **Componentes:** buttons, cards, forms, badges, alerts, tables, progress, modals, toasts, stats, switches…
6. **Audio UI:** Web Audio sintético — tick al tipear en inputs/login/search; toggle `data-nx-audio` / `NexusUI.setAudioEnabled`
7. **Video:**
   - Inline: `.nx-video.nx-video-glass`
   - Flotante: `NexusUI.openVideo({ src, title, type })` — centrado al abrir, arrastrable, min/max, glass semitransparente
   - Local (mp4/webm) + YouTube/Vimeo/etc.

---

## Bugs ya corregidos (no reintroducir)

- Side-nav “muy abajo” / se perdía al resize → centrar en banda segura con `100dvh`, no `display:none` en mobile.
- Video float iniciaba abajo-derecha y el drag fallaba (conflicto `translate` vs `left/top`) → siempre centrado al abrir; drag con coordenadas absolutas + `is-placed`.

---

## API JS principal (`window.NexusUI`)

```js
NexusUI.init({ particles, boot, enter, audio })
NexusUI.setTheme / getTheme
NexusUI.setTransition / getTransition / navigate
NexusUI.toast / openModal / closeModal
NexusUI.setAudioEnabled / setAudioVolume / playSound
NexusUI.openVideo / closeVideo
```

Auto-init: `data-nx-auto` en `<html>` o `<body>`.

---

## Integración rápida (cualquier app)

```html
<link rel="stylesheet" href="path/to/css/nexus.css" />
<html data-nx-auto data-nx-transition="portal">
<body class="nx-body" data-nx-fx="scanlines grid noise particles vignette" data-nx-audio="on">
  <div class="nx-app nx-view">
    <header class="nx-topbar">…</header>
    <nav class="nx-side-nav">…</nav>
    <main class="nx-main has-side-nav">…</main>
    <nav class="nx-dock">…</nav>
  </div>
  <script src="path/to/js/nexus.js"></script>
</body>
```

---

## Siguiente trabajo sugerido

### Corto plazo
- [ ] Screenshot/GIF del demo en el README (social preview GitHub)
- [ ] Build minificado (`nexus.min.css` / `nexus.min.js`) opcional
- [ ] Migrar **intranet del usuario** a NexusjUI (hay brief de agente listo)

### Medio plazo
- [ ] Web Components (`<nx-card>`, `<nx-dock>`)
- [ ] Más componentes (command palette, sidebar app, charts)
- [ ] Wrappers React/Vue
- [ ] Audio whoosh en cambio de página / sonidos de error de form

### Intranet
El usuario quiere que un **agente dev de su intranet** reemplace el diseño básico por NexusjUI.  
Brief completo ya redactado en conversación (2026-07-17): layout shell → login → dashboard → CRUD; no tocar backend/auth; copiar vendor desde este repo.

---

## Preferencias del usuario (Jhalmar)

- Habla en **español**
- Quiere look **ultra futurista / película 2060**
- Valora menús flotantes, motion 3D, audio HUD, video glass
- Repo público: **Jhalmarm/NexusjUI**
- Publicación hecha: Pages + release v0.1.0 + topics + description

---

## Comandos útiles

```bash
cd /Users/jhalmarmolina/ZCodeProject/nexus-ui
python3 -m http.server 8765
# http://localhost:8765/demo/

git status
git add -A && git commit -m "…" && git push origin main
gh release list
```

---

## Cómo retomar (prompt para otro agente)

> Continúa el proyecto NexusjUI en `/Users/jhalmarmolina/ZCodeProject/nexus-ui` (GitHub: Jhalmarm/NexusjUI). Lee `CONTEXT.md` y `README.md`. Es un kit UI futurista drop-in v0.1.0 ya publicado. No reintroduzcas bugs de side-nav ni del video float. Siguiente paso probable: mejorar README con media, minificar, o ayudar a migrar una intranet a este kit.

# NEXUS UI · NexusjUI

[![License: MIT](https://img.shields.io/badge/License-MIT-00f0ff.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-8b5cff.svg)](https://github.com/Jhalmarm/NexusjUI)
[![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-ff2bd6.svg)](https://github.com/Jhalmarm/NexusjUI)

**Futuristic drop-in UI kit** — floating nav, holographic glass panels, sci‑fi themes, cinematic 3D page transitions, HUD audio ticks, and a floating video player.

Looks like a system from a **2060 movie**. Plugs into **any** stack: plain HTML, Laravel, Django, PHP, static sites, or SPA via CDN.

> Version: **0.1.0 MVP** · Repo: [Jhalmarm/NexusjUI](https://github.com/Jhalmarm/NexusjUI)

---

## Quick start

```bash
git clone git@github.com:Jhalmarm/NexusjUI.git
cd NexusjUI
python3 -m http.server 8765
# open http://localhost:8765/demo/
```

Or open `demo/index.html` with a local server (relative paths and fonts work better than `file://`).

---

## Instalación (drop-in)

Copia la carpeta `nexus-ui` a tu proyecto y enlaza:

```html
<!DOCTYPE html>
<html lang="es" data-nx-auto data-nx-transition="portal">
<head>
  <link rel="stylesheet" href="path/to/nexus-ui/css/nexus.css" />
</head>
<body class="nx-body" data-nx-fx="scanlines grid noise particles vignette">
  <div class="nx-app nx-view">
    <!-- tu contenido -->
    <nav class="nx-dock">...</nav>
  </div>
  <script src="path/to/nexus-ui/js/nexus.js"></script>
</body>
</html>
```

`data-nx-auto` inicializa el runtime al cargar. También puedes llamar `NexusUI.init()` manualmente.

---

## Estructura

```
nexus-ui/
├── css/
│   ├── nexus.css      ← entrypoint (importa el resto)
│   ├── tokens.css     ← design tokens + temas
│   ├── base.css
│   ├── effects.css    ← glass, scanlines, grid, glow
│   ├── components.css ← botones, cards, forms, modal…
│   ├── nav.css        ← dock flotante + side nav
│   └── motion.css     ← transiciones 3D / View Transitions
├── js/
│   └── nexus.js       ← runtime
├── demo/              ← 4 páginas de ejemplo
└── README.md
```

---

## Temas

| Valor `data-nx-theme` | Look |
|----------------------|------|
| *(vacío / cyber)* | Cyan neón (default) |
| `void` | Púrpura vacío |
| `ice` | Hielo / cold HUD |
| `ember` | Naranja / alerta |

```js
NexusUI.setTheme("void");
```

También con botones: `data-nx-set-theme="ice"`.

---

## Efectos de ambiente

En el `<body>`:

```html
data-nx-fx="scanlines grid noise particles vignette"
```

| Token | Efecto |
|-------|--------|
| `scanlines` | Líneas CRT |
| `grid` | Piso en perspectiva |
| `noise` | Grain sutil |
| `particles` | Campo de partículas (canvas) |
| `vignette` | Viñeta |

---

## Transiciones entre páginas

Tipos: `portal` · `fade-depth` · `cube` · `flip` · `glitch`

```html
<html data-nx-transition="portal">
<a href="/dashboard" data-nx-transition="cube">Ir</a>
```

```js
NexusUI.setTransition("glitch");
NexusUI.navigate("/systems.html", "portal");
```

Usa la **View Transitions API** cuando el navegador la soporta; si no, cae a animaciones CSS 3D sobre `.nx-view`.

Los links del `.nx-dock`, `.nx-side-nav` y con clase `nx-nav-link` animan automáticamente.

---

## Componentes (clases)

| Clase | Uso |
|-------|-----|
| `.nx-btn` `.nx-btn-primary` `.nx-btn-ghost` `.nx-btn-danger` | Botones |
| `.nx-card` `.nx-card-float` `.nx-frame` `.nx-border-glow` | Paneles |
| `.nx-input` `.nx-select` `.nx-textarea` `.nx-field` | Forms |
| `.nx-badge` `.nx-alert` `.nx-progress` `.nx-table` | Data UI |
| `.nx-dock` `.nx-side-nav` `.nx-topbar` `.nx-fab` | Navegación flotante |
| `.nx-modal-backdrop` `.nx-modal` | Modal 3D |
| `.nx-display` `.nx-mono` `.nx-label` | Tipografía |
| `.nx-glass` `.nx-shimmer` `.nx-tilt` `.nx-reveal` | Efectos |
| `.nx-video` `.nx-video-glass` + float player | Video local / embed |

---

## API JS (`window.NexusUI`)

```js
NexusUI.init({ particles: true, boot: true, enter: true, audio: true });
NexusUI.setTheme("ember");
NexusUI.getTheme();
NexusUI.setTransition("cube");
NexusUI.getTransition();
NexusUI.navigate("dashboard.html", "portal");
NexusUI.openModal("mi-modal-id");
NexusUI.closeModal("mi-modal-id");
NexusUI.toast("Mensaje", "success" | "info" | "warning" | "error");
NexusUI.setAudioEnabled(true);
NexusUI.setAudioVolume(0.4); // 0–1
NexusUI.playSound("tick"); // backspace | enter | click | confirm | error
NexusUI.openVideo({ src: "clip.mp4", title: "Brief", type: "auto" });
NexusUI.closeVideo();
```

Eventos:

- `nx:ready` — runtime listo  
- `nx:theme` — cambió el tema  
- `nx:transition` — cambió la transición  
- `nx:audio` — audio on/off o volumen  

---

## Audio UI (tic al tipear)

Sonidos **sintéticos** con Web Audio API (sin archivos `.mp3`). Ideal para login, search y forms sci‑fi.

### Activar

```html
<body data-nx-audio="on">
```

```js
NexusUI.setAudioEnabled(true);
```

### Comportamiento

| Acción | Sonido |
|--------|--------|
| Caracter al tipear | `tick` micro |
| Backspace / Delete | `backspace` más grave |
| Enter | `enter` confirmación corta |
| Click en botones / dock | `click` suave |

Funciona en `input` (text, search, password, email…), `textarea` y `contenteditable`.

### Silenciar un campo

```html
<input class="nx-input" data-nx-silent />
```

### Toggle en UI

```html
<label class="nx-switch">
  <input type="checkbox" data-nx-audio-toggle />
  <span></span>
</label>
<input type="range" min="0" max="100" data-nx-audio-volume />
```

> Los navegadores requieren un gesto del usuario antes de emitir audio; NEXUS desbloquea el contexto en el primer clic/tecla.

---

## Video (local + embed, flotante glass)

### Inline (en la página)

```html
<div class="nx-video nx-video-glass">
  <div class="nx-video-frame">
    <video src="clip.mp4" controls playsinline></video>
    <div class="nx-video-hud"></div>
  </div>
  <div class="nx-video-meta">
    <div>
      <p class="nx-video-title">Mission brief</p>
      <p class="nx-video-sub">Local feed</p>
    </div>
  </div>
</div>
```

### Flotante (arrastrable, min/max)

```html
<button
  data-nx-video
  data-nx-src="https://youtube.com/watch?v=…"
  data-nx-title="Briefing"
  data-nx-type="auto"
>
  Ver
</button>
```

```js
// Local
NexusUI.openVideo({ src: "/media/demo.mp4", title: "Demo", type: "local" });

// YouTube / Vimeo (convierte la URL a embed)
NexusUI.openVideo({ src: "https://youtu.be/xxxx", title: "Uplink" });

// Maximizado con scrim
NexusUI.openVideo({ src: "clip.webm", maximized: true });
```

Soporta: **mp4/webm/ogg**, **YouTube**, **Vimeo**, **Dailymotion**, **Loom**, y otras URLs de iframe.

Demo: `demo/media.html` y sección en `demo/components.html`.

---

## Accesibilidad

- Respeta `prefers-reduced-motion` (desactiva partículas y animaciones pesadas).
- Focus visible en botones.
- Modal cierra con `Escape` y click en backdrop.
- Audio es **opt-in** (`data-nx-audio="on"`) y se puede apagar en Systems o con `setAudioEnabled(false)`.

---

## Roadmap (ideas v0.2+)

- [ ] Build minificado único (`nexus.min.css` / `nexus.min.js`)
- [ ] Web Components (`<nx-card>`, `<nx-dock>`)
- [ ] Más componentes (sidebar app, charts, stepper, command palette)
- [x] Audio UI opcional (tic al tipear + clicks HUD)
- [ ] Wrappers React / Vue
- [ ] Dark/light “ice white” premium
- [ ] Tokens exportables a Figma

---

## Licencia

Uso libre en tus proyectos. Hecho para reutilizar en cualquier sistema que desarrolles.

/**
 * NEXUS UI — Runtime
 * Floating nav helpers, particles, theming, 3D page transitions
 */
(function (global) {
  "use strict";

  const STORAGE_THEME = "nx-theme";
  const STORAGE_TRANSITION = "nx-transition";
  const STORAGE_AUDIO = "nx-audio";
  const STORAGE_AUDIO_VOLUME = "nx-audio-volume";
  const DEFAULT_TRANSITION = "portal";
  const TRANSITIONS = ["fade-depth", "portal", "cube", "flip", "glitch"];

  const prefersReducedMotion = () =>
    global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const prefersReducedData = () =>
    global.matchMedia && global.matchMedia("(prefers-reduced-data: reduce)").matches;

  /* —— Theme —— */
  function getTheme() {
    return localStorage.getItem(STORAGE_THEME) || document.documentElement.getAttribute("data-nx-theme") || "cyber";
  }

  function setTheme(name) {
    const theme = name === "cyber" ? null : name;
    if (theme) {
      document.documentElement.setAttribute("data-nx-theme", theme);
      localStorage.setItem(STORAGE_THEME, theme);
    } else {
      document.documentElement.removeAttribute("data-nx-theme");
      localStorage.setItem(STORAGE_THEME, "cyber");
    }
    document.dispatchEvent(new CustomEvent("nx:theme", { detail: { theme: name || "cyber" } }));
  }

  function applyStoredTheme() {
    const stored = localStorage.getItem(STORAGE_THEME);
    if (stored && stored !== "cyber") {
      document.documentElement.setAttribute("data-nx-theme", stored);
    }
  }

  /* —— Transitions —— */
  function getTransition() {
    return (
      localStorage.getItem(STORAGE_TRANSITION) ||
      document.documentElement.getAttribute("data-nx-transition") ||
      DEFAULT_TRANSITION
    );
  }

  function setTransition(name) {
    const t = TRANSITIONS.includes(name) ? name : DEFAULT_TRANSITION;
    document.documentElement.setAttribute("data-nx-transition", t);
    localStorage.setItem(STORAGE_TRANSITION, t);
    syncTransitionPicker(t);
    document.dispatchEvent(new CustomEvent("nx:transition", { detail: { transition: t } }));
  }

  function applyStoredTransition() {
    const t = getTransition();
    document.documentElement.setAttribute("data-nx-transition", t);
    syncTransitionPicker(t);
  }

  function syncTransitionPicker(active) {
    document.querySelectorAll("[data-nx-set-transition]").forEach((btn) => {
      const name = btn.getAttribute("data-nx-set-transition");
      btn.classList.toggle("is-active", name === active);
    });
  }

  function supportsViewTransitions() {
    return typeof document.startViewTransition === "function";
  }

  function supportsCrossDocumentVT() {
    try {
      return CSS && CSS.supports && CSS.supports("view-transition-name", "none") && "onpageswap" in global;
    } catch {
      return false;
    }
  }

  function bindCrossDocumentVT() {
    // Tag outgoing page transition type for MPA View Transitions
    global.addEventListener("pageswap", (e) => {
      if (!e.viewTransition) return;
      const t = sessionStorage.getItem("nx-pending-transition") || getTransition();
      try {
        e.viewTransition.types.clear();
        e.viewTransition.types.add(t);
      } catch (_) {
        /* older engines */
      }
      document.documentElement.setAttribute("data-nx-transition", t);
    });

    global.addEventListener("pagereveal", (e) => {
      if (!e.viewTransition) return;
      const t = sessionStorage.getItem("nx-pending-transition") || getTransition();
      try {
        e.viewTransition.types.clear();
        e.viewTransition.types.add(t);
      } catch (_) {
        /* ignore */
      }
      document.documentElement.setAttribute("data-nx-transition", t);
      sessionStorage.removeItem("nx-pending-transition");
    });
  }

  async function navigateWithTransition(url, transitionName) {
    const t = transitionName || getTransition();
    document.documentElement.setAttribute("data-nx-transition", t);
    sessionStorage.setItem("nx-pending-transition", t);
    localStorage.setItem(STORAGE_TRANSITION, t);

    if (prefersReducedMotion()) {
      global.location.href = url;
      return;
    }

    // Modern browsers: let cross-document @view-transition handle it
    if (supportsCrossDocumentVT()) {
      global.location.href = url;
      return;
    }

    // Fallback: animate current view then navigate
    const view = document.querySelector(".nx-view") || document.body;
    view.classList.add("nx-view", `is-leaving-${t}`);
    await wait(
      durationToMs(
        getComputedStyle(document.documentElement).getPropertyValue("--nx-dur-scene")
      ) || 900
    );
    global.location.href = url;
  }

  function durationToMs(value) {
    if (!value) return 0;
    const v = value.trim();
    if (v.endsWith("ms")) return parseFloat(v);
    if (v.endsWith("s")) return parseFloat(v) * 1000;
    return parseFloat(v) || 0;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function bindTransitionLinks() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-nx-transition], a.nx-nav-link, .nx-dock a, .nx-side-nav a");
      if (!link) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (link.hasAttribute("download")) return;

      // same-origin only
      let url;
      try {
        url = new URL(href, global.location.href);
      } catch {
        return;
      }
      if (url.origin !== global.location.origin) return;
      if (url.pathname === global.location.pathname && url.search === global.location.search && url.hash) return;

      e.preventDefault();
      const t = link.getAttribute("data-nx-transition") || getTransition();
      navigateWithTransition(url.href, t);
    });
  }

  function bindTransitionPicker() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-nx-set-transition]");
      if (!btn) return;
      setTransition(btn.getAttribute("data-nx-set-transition"));
      toast(`Transition: ${btn.getAttribute("data-nx-set-transition")}`, "info");
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-nx-set-theme]");
      if (!btn) return;
      setTheme(btn.getAttribute("data-nx-set-theme"));
      toast(`Theme: ${btn.getAttribute("data-nx-set-theme")}`, "info");
      document.querySelectorAll("[data-nx-set-theme]").forEach((el) => {
        el.classList.toggle("is-active", el.getAttribute("data-nx-set-theme") === btn.getAttribute("data-nx-set-theme"));
      });
    });
  }

  /* —— Active nav —— */
  function markActiveNav() {
    const path = global.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nx-dock a, .nx-side-nav a, a.nx-nav-link").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      const active = href === path || (path === "" && href === "index.html");
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* —— Particles —— */
  function initParticles() {
    const fx = document.body.getAttribute("data-nx-fx") || "";
    if (!fx.includes("particles") || prefersReducedMotion()) return;

    let canvas = document.getElementById("nx-particles");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "nx-particles";
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let particles = [];
    let raf = 0;
    let accent = getAccentColor();

    function getAccentColor() {
      return getComputedStyle(document.documentElement).getPropertyValue("--nx-accent").trim() || "#00f0ff";
    }

    function resize() {
      w = canvas.width = global.innerWidth;
      h = canvas.height = global.innerHeight;
      const count = Math.min(70, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => spawn());
    }

    function spawn() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.05,
        a: Math.random() * 0.5 + 0.15,
      };
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = accent;
        ctx.globalAlpha = p.a;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // soft links
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 110) {
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (1 - d / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    global.addEventListener("resize", resize);
    document.addEventListener("nx:theme", () => {
      accent = getAccentColor();
    });

    return () => {
      cancelAnimationFrame(raf);
      global.removeEventListener("resize", resize);
    };
  }

  /* —— Modal —— */
  function openModal(id) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    const focusable = el.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function bindModals() {
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-nx-modal-open]");
      if (openBtn) {
        openModal(openBtn.getAttribute("data-nx-modal-open"));
        return;
      }
      const closeBtn = e.target.closest("[data-nx-modal-close]");
      if (closeBtn) {
        const backdrop = closeBtn.closest(".nx-modal-backdrop");
        if (backdrop) closeModal(backdrop);
        return;
      }
      if (e.target.classList.contains("nx-modal-backdrop")) {
        closeModal(e.target);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".nx-modal-backdrop.is-open").forEach(closeModal);
      }
    });
  }

  /* —— Toasts —— */
  function ensureToastHost() {
    let host = document.querySelector(".nx-toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "nx-toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, type = "info", ms = 2800) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = `nx-toast nx-alert nx-alert-${type === "error" ? "danger" : type}`;
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(16px)";
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      setTimeout(() => el.remove(), 320);
    }, ms);
  }

  /* —— Tabs —— */
  function bindTabs() {
    document.querySelectorAll("[data-nx-tabs]").forEach((root) => {
      const tabs = root.querySelectorAll(".nx-tab");
      const panels = document.querySelectorAll(`[data-nx-tab-panel="${root.id}"] .nx-tab-panel, [data-nx-tabs-target="${root.id}"] .nx-tab-panel`);
      // also support sibling panels container
      const panelRoot = document.querySelector(`[data-nx-tabs-target="${root.id}"]`);
      const allPanels = panelRoot ? panelRoot.querySelectorAll(".nx-tab-panel") : [];

      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("is-active"));
          tab.classList.add("is-active");
          allPanels.forEach((p, j) => {
            p.hidden = j !== i;
          });
        });
      });
    });
  }

  /* —— Audio UI (synthetic HUD ticks, no audio files) —— */
  let audioCtx = null;
  let audioEnabled = false;
  let audioVolume = 0.35;
  let audioBound = false;
  let lastTickAt = 0;

  function isAudioOptInFromDom() {
    const body = document.body;
    if (!body) return false;
    if (body.hasAttribute("data-nx-audio")) {
      const v = (body.getAttribute("data-nx-audio") || "on").toLowerCase();
      return v !== "off" && v !== "false" && v !== "0";
    }
    const fx = body.getAttribute("data-nx-fx") || "";
    return /\baudio\b/.test(fx);
  }

  function getAudioEnabled() {
    const stored = localStorage.getItem(STORAGE_AUDIO);
    if (stored === "1" || stored === "true") return true;
    if (stored === "0" || stored === "false") return false;
    return isAudioOptInFromDom();
  }

  function setAudioEnabled(on, { silent } = {}) {
    audioEnabled = !!on;
    localStorage.setItem(STORAGE_AUDIO, audioEnabled ? "1" : "0");
    document.body?.setAttribute("data-nx-audio", audioEnabled ? "on" : "off");
    syncAudioToggles();
    if (audioEnabled) ensureAudio();
    if (!silent) {
      if (audioEnabled) {
        playSound("confirm");
        toast("Audio UI online", "success");
      } else {
        toast("Audio UI offline", "info");
      }
    }
    document.dispatchEvent(new CustomEvent("nx:audio", { detail: { enabled: audioEnabled, volume: audioVolume } }));
  }

  function setAudioVolume(v) {
    audioVolume = Math.min(1, Math.max(0, Number(v) || 0));
    localStorage.setItem(STORAGE_AUDIO_VOLUME, String(audioVolume));
    document.dispatchEvent(new CustomEvent("nx:audio", { detail: { enabled: audioEnabled, volume: audioVolume } }));
  }

  function getAudioVolume() {
    return audioVolume;
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function unlockAudioOnGesture() {
    if (audioBound) return;
    audioBound = true;
    const unlock = () => {
      if (!audioEnabled) return;
      ensureAudio();
    };
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock, { passive: true });
  }

  /**
   * Synthesize micro HUD sounds.
   * @param {"tick"|"backspace"|"enter"|"click"|"confirm"|"error"} type
   */
  function playSound(type = "tick") {
    if (!audioEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => emitSound(type)).catch(() => {});
      return;
    }
    emitSound(type);
  }

  function emitSound(type = "tick") {
    const ctx = audioCtx;
    if (!ctx) return;
    // throttle ultra-fast repeats (paste / key repeat)
    const now = performance.now();
    if (type === "tick" && now - lastTickAt < 18) return;
    if (type === "tick") lastTickAt = now;

    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = audioVolume * 0.55;
    master.connect(ctx.destination);

    const variants = {
      tick: { freq: 1850 + Math.random() * 420, dur: 0.028, type: "triangle", gain: 0.22, noise: 0.08 },
      backspace: { freq: 620 + Math.random() * 80, dur: 0.04, type: "sine", gain: 0.14, noise: 0.05 },
      enter: { freq: 980, dur: 0.07, type: "triangle", gain: 0.2, noise: 0.04, freq2: 1460 },
      click: { freq: 1400, dur: 0.035, type: "square", gain: 0.08, noise: 0.06 },
      confirm: { freq: 880, dur: 0.1, type: "sine", gain: 0.16, freq2: 1320 },
      error: { freq: 240, dur: 0.12, type: "sawtooth", gain: 0.12, freq2: 180 },
    };

    const cfg = variants[type] || variants.tick;

    // tonal blip
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, t0);
    if (cfg.freq2) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, cfg.freq2), t0 + cfg.dur * 0.85);
    } else if (type === "tick") {
      osc.frequency.exponentialRampToValueAtTime(cfg.freq * 0.55, t0 + cfg.dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(cfg.gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + cfg.dur + 0.02);

    // tiny noise transient (mechanical "tic")
    if (cfg.noise) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * 0.018));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const ng = ctx.createGain();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = type === "backspace" ? 900 : 3200;
      bp.Q.value = 0.7;
      ng.gain.value = cfg.noise;
      noise.connect(bp);
      bp.connect(ng);
      ng.connect(master);
      noise.start(t0);
      noise.stop(t0 + 0.02);
    }
  }

  function isTypingTarget(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.closest?.("[data-nx-silent], [data-nx-audio='off']")) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (el.type || "text").toLowerCase();
      const allowed = [
        "text",
        "search",
        "email",
        "password",
        "tel",
        "url",
        "number",
        "date",
        "time",
        "datetime-local",
        "month",
        "week",
      ];
      return allowed.includes(type);
    }
    if (el.isContentEditable) return true;
    return false;
  }

  function onTypingKey(e) {
    if (!audioEnabled || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!isTypingTarget(e.target)) return;

    if (e.key === "Backspace" || e.key === "Delete") {
      playSound("backspace");
      return;
    }
    if (e.key === "Enter") {
      playSound("enter");
      return;
    }
    // Printable character (length 1) or space
    if (e.key === " " || (e.key && e.key.length === 1)) {
      playSound("tick");
    }
  }

  function onUiClick(e) {
    if (!audioEnabled) return;
    const btn = e.target.closest("button, .nx-btn, .nx-dock-item, .nx-tab, .nx-switch");
    if (!btn) return;
    if (btn.closest?.("[data-nx-silent]")) return;
    // avoid double with typing
    if (isTypingTarget(e.target)) return;
    playSound("click");
  }

  function syncAudioToggles() {
    document.querySelectorAll("[data-nx-audio-toggle]").forEach((input) => {
      if (input.type === "checkbox") input.checked = audioEnabled;
    });
    document.querySelectorAll("[data-nx-audio-on]").forEach((el) => {
      el.classList.toggle("is-active", audioEnabled);
    });
    document.querySelectorAll("[data-nx-audio-off]").forEach((el) => {
      el.classList.toggle("is-active", !audioEnabled);
    });
    const vol = document.querySelector("[data-nx-audio-volume]");
    if (vol && "value" in vol) vol.value = String(Math.round(audioVolume * 100));
  }

  function bindAudioUi() {
    const storedVol = localStorage.getItem(STORAGE_AUDIO_VOLUME);
    if (storedVol != null) audioVolume = Math.min(1, Math.max(0, parseFloat(storedVol) || 0.35));
    audioEnabled = getAudioEnabled();
    if (audioEnabled) document.body?.setAttribute("data-nx-audio", "on");

    unlockAudioOnGesture();
    document.addEventListener("keydown", onTypingKey, true);
    document.addEventListener("click", onUiClick, true);

    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.matches?.("[data-nx-audio-toggle]")) {
        setAudioEnabled(!!t.checked);
      }
      if (t && t.matches?.("[data-nx-audio-volume]")) {
        setAudioVolume((Number(t.value) || 0) / 100);
        if (audioEnabled) playSound("tick");
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest?.("[data-nx-audio-on]")) setAudioEnabled(true);
      if (e.target.closest?.("[data-nx-audio-off]")) setAudioEnabled(false);
    });

    syncAudioToggles();
  }

  /* —— Video player (local + embed, floating glass) —— */
  let videoFloatEl = null;
  let videoScrimEl = null;
  let videoDrag = null;
  let videoDragBound = false;

  function isDirectVideoUrl(url) {
    return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url || "");
  }

  function toEmbedUrl(raw) {
    if (!raw) return null;
    let url = String(raw).trim();

    // Already an embed path
    if (/youtube\.com\/embed\//i.test(url) || /player\.vimeo\.com\/video\//i.test(url)) {
      return url;
    }

    // YouTube
    let m =
      url.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{6,})/i) ||
      url.match(/youtube\.com\/embed\/([\w-]{6,})/i);
    if (m) {
      return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1`;
    }

    // Vimeo
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m) {
      return `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0`;
    }

    // Dailymotion
    m = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
    if (m) {
      return `https://www.dailymotion.com/embed/video/${m[1]}`;
    }

    // Loom
    m = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
    if (m) {
      return `https://www.loom.com/embed/${m[1]}`;
    }

    // Generic: treat absolute http(s) as possible iframe src
    if (/^https?:\/\//i.test(url) && !isDirectVideoUrl(url)) {
      return url;
    }

    return null;
  }

  function resolveVideoSource(src, type) {
    const raw = (src || "").trim();
    const t = (type || "auto").toLowerCase();

    if (t === "local" || t === "file" || t === "video") {
      return { kind: "video", src: raw };
    }
    if (t === "embed" || t === "iframe") {
      return { kind: "iframe", src: toEmbedUrl(raw) || raw };
    }

    // auto
    if (isDirectVideoUrl(raw) || raw.startsWith("blob:") || raw.startsWith("data:video")) {
      return { kind: "video", src: raw };
    }
    const embed = toEmbedUrl(raw);
    if (embed) return { kind: "iframe", src: embed };
    // fallback: try as local/path video
    return { kind: "video", src: raw };
  }

  function ensureVideoFloat() {
    if (videoFloatEl && document.body.contains(videoFloatEl)) return videoFloatEl;

    videoScrimEl = document.createElement("div");
    videoScrimEl.className = "nx-video-float-scrim";
    videoScrimEl.setAttribute("aria-hidden", "true");
    videoScrimEl.addEventListener("click", () => closeVideo());

    videoFloatEl = document.createElement("div");
    videoFloatEl.className = "nx-video-float";
    videoFloatEl.setAttribute("role", "dialog");
    videoFloatEl.setAttribute("aria-modal", "false");
    videoFloatEl.setAttribute("aria-label", "Video player");
    videoFloatEl.innerHTML = `
      <div class="nx-video-float-bar" data-nx-video-drag>
        <span class="nx-video-float-dot" aria-hidden="true"></span>
        <div class="nx-video-title" data-nx-video-title>NEXUS stream</div>
        <div class="nx-video-float-actions">
          <button type="button" data-nx-video-min title="Minimizar" aria-label="Minimizar">–</button>
          <button type="button" data-nx-video-max title="Expandir" aria-label="Expandir">□</button>
          <button type="button" class="nx-video-close" data-nx-video-close title="Cerrar" aria-label="Cerrar">✕</button>
        </div>
      </div>
      <div class="nx-video-float-body">
        <div class="nx-video-frame" data-nx-video-stage>
          <div class="nx-video-hud" aria-hidden="true"></div>
        </div>
      </div>
    `;

    document.body.appendChild(videoScrimEl);
    document.body.appendChild(videoFloatEl);

    videoFloatEl.querySelector("[data-nx-video-close]").addEventListener("click", () => closeVideo());
    videoFloatEl.querySelector("[data-nx-video-min]").addEventListener("click", () => {
      videoFloatEl.classList.toggle("is-minimized");
      videoFloatEl.classList.remove("is-maximized");
      videoScrimEl.classList.remove("is-on");
      // Keep current placed coords if any; if centered, stay centered
      if (audioEnabled) playSound("click");
    });
    videoFloatEl.querySelector("[data-nx-video-max]").addEventListener("click", () => {
      const max = videoFloatEl.classList.toggle("is-maximized");
      videoFloatEl.classList.remove("is-minimized");
      videoScrimEl.classList.toggle("is-on", max);
      if (max) {
        // Expand from center
        videoFloatEl.classList.remove("is-placed");
        videoFloatEl.style.left = "50%";
        videoFloatEl.style.top = "50%";
        videoFloatEl.style.right = "auto";
        videoFloatEl.style.bottom = "auto";
        videoFloatEl.style.removeProperty("transform");
      } else {
        // Back to centered floating window
        centerVideoFloat();
      }
      if (audioEnabled) playSound("click");
    });

    bindVideoDrag(videoFloatEl.querySelector("[data-nx-video-drag]"));
    return videoFloatEl;
  }

  function placeVideoAt(x, y) {
    if (!videoFloatEl) return;
    const w = videoFloatEl.offsetWidth;
    const h = videoFloatEl.offsetHeight;
    const maxX = Math.max(8, global.innerWidth - w - 8);
    const maxY = Math.max(8, global.innerHeight - h - 8);
    const px = Math.min(Math.max(8, x), maxX);
    const py = Math.min(Math.max(8, y), maxY);
    videoFloatEl.style.left = `${px}px`;
    videoFloatEl.style.top = `${py}px`;
    videoFloatEl.style.right = "auto";
    videoFloatEl.style.bottom = "auto";
    videoFloatEl.style.transform = "none";
    videoFloatEl.classList.add("is-placed");
  }

  function centerVideoFloat() {
    if (!videoFloatEl) return;
    videoFloatEl.classList.remove("is-placed", "is-dragging");
    videoFloatEl.style.left = "50%";
    videoFloatEl.style.top = "50%";
    videoFloatEl.style.right = "auto";
    videoFloatEl.style.bottom = "auto";
    videoFloatEl.style.removeProperty("transform");
  }

  function bindVideoDrag(handle) {
    if (!handle || videoDragBound) return;
    videoDragBound = true;

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest("button")) return;
      if (!videoFloatEl || videoFloatEl.classList.contains("is-maximized")) return;

      // Convert centered transform position → absolute pixels BEFORE drag
      const rect = videoFloatEl.getBoundingClientRect();
      placeVideoAt(rect.left, rect.top);

      videoDrag = {
        id: e.pointerId,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
        moved: false,
      };
      videoFloatEl.classList.add("is-dragging");
      e.preventDefault();

      try {
        handle.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    };

    const onPointerMove = (e) => {
      if (!videoDrag || videoDrag.id !== e.pointerId) return;
      // Ignore pure hover / zero-button moves if capture was lost
      if (e.buttons === 0) {
        endVideoDrag(e);
        return;
      }
      videoDrag.moved = true;
      placeVideoAt(e.clientX - videoDrag.ox, e.clientY - videoDrag.oy);
    };

    const endVideoDrag = (e) => {
      if (!videoDrag) return;
      if (e && videoDrag.id != null && e.pointerId != null && videoDrag.id !== e.pointerId) return;
      videoDrag = null;
      if (videoFloatEl) videoFloatEl.classList.remove("is-dragging");
      try {
        if (e && e.pointerId != null) handle.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    };

    // Listen on handle for down; document for move/up so drag never "sticks" or freezes
    handle.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endVideoDrag);
    document.addEventListener("pointercancel", endVideoDrag);
    // Safety: if window blurs mid-drag
    global.addEventListener("blur", () => {
      videoDrag = null;
      if (videoFloatEl) videoFloatEl.classList.remove("is-dragging");
    });
  }

  function clearVideoStage(stage) {
    if (!stage) return;
    stage.querySelectorAll("video, iframe").forEach((el) => {
      if (el.tagName === "VIDEO") {
        try {
          el.pause();
          el.removeAttribute("src");
          el.load();
        } catch (_) {
          /* ignore */
        }
      }
      el.remove();
    });
  }

  /**
   * Open floating glass video player.
   * @param {Object|string} opts - url string or options
   * @param {string} opts.src
   * @param {string} [opts.title]
   * @param {"auto"|"local"|"embed"} [opts.type]
   * @param {boolean} [opts.autoplay=true]
   * @param {boolean} [opts.maximized=false]
   */
  function openVideo(opts) {
    const options = typeof opts === "string" ? { src: opts } : opts || {};
    const src = options.src || options.url || "";
    if (!src) {
      toast("Video: falta src", "warning");
      return null;
    }

    const resolved = resolveVideoSource(src, options.type);
    if (!resolved.src) {
      toast("Video: URL no válida", "error");
      return null;
    }

    const shell = ensureVideoFloat();
    const stage = shell.querySelector("[data-nx-video-stage]");
    const titleEl = shell.querySelector("[data-nx-video-title]");
    clearVideoStage(stage);

    titleEl.textContent = options.title || (resolved.kind === "iframe" ? "Embedded stream" : "Local stream");

    if (resolved.kind === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.src = resolved.src;
      iframe.title = options.title || "Embedded video";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.loading = "lazy";
      // insert before HUD
      stage.insertBefore(iframe, stage.querySelector(".nx-video-hud"));
    } else {
      const video = document.createElement("video");
      video.src = resolved.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      if (options.poster) video.poster = options.poster;
      if (options.autoplay !== false) {
        video.autoplay = true;
        video.muted = !!options.muted; // autoplay policies
      }
      stage.insertBefore(video, stage.querySelector(".nx-video-hud"));
      if (options.autoplay !== false) {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    }

    shell.classList.remove("is-minimized", "is-dragging");
    if (options.maximized) {
      shell.classList.add("is-maximized");
      videoScrimEl.classList.add("is-on");
    } else {
      shell.classList.remove("is-maximized");
      videoScrimEl.classList.remove("is-on");
    }

    // Always open centered (user request)
    centerVideoFloat();
    videoDrag = null;

    // Force reflow so open animation plays from center
    void shell.offsetWidth;
    requestAnimationFrame(() => shell.classList.add("is-open"));
    if (audioEnabled) playSound("confirm");
    document.dispatchEvent(
      new CustomEvent("nx:video", { detail: { action: "open", src: resolved.src, kind: resolved.kind } })
    );
    return shell;
  }

  function closeVideo() {
    if (!videoFloatEl) return;
    const stage = videoFloatEl.querySelector("[data-nx-video-stage]");
    clearVideoStage(stage);
    videoDrag = null;
    videoFloatEl.classList.remove("is-open", "is-maximized", "is-minimized", "is-dragging", "is-placed");
    centerVideoFloat();
    if (videoScrimEl) videoScrimEl.classList.remove("is-on");
    if (audioEnabled) playSound("click");
    document.dispatchEvent(new CustomEvent("nx:video", { detail: { action: "close" } }));
  }

  function bindVideoTriggers() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-nx-video], [data-nx-video-open]");
      if (!trigger) return;
      e.preventDefault();
      openVideo({
        src: trigger.getAttribute("data-nx-src") || trigger.getAttribute("href") || trigger.getAttribute("data-src"),
        title: trigger.getAttribute("data-nx-title") || trigger.getAttribute("data-title") || trigger.textContent.trim(),
        type: trigger.getAttribute("data-nx-type") || trigger.getAttribute("data-type") || "auto",
        poster: trigger.getAttribute("data-nx-poster") || undefined,
        maximized: trigger.hasAttribute("data-nx-maximized"),
        autoplay: trigger.getAttribute("data-nx-autoplay") !== "false",
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && videoFloatEl?.classList.contains("is-open")) {
        closeVideo();
      }
    });
  }

  /* —— Boot flash —— */
  function bootFlash() {
    if (prefersReducedMotion()) return;
    const flash = document.createElement("div");
    flash.className = "nx-boot-flash";
    flash.setAttribute("aria-hidden", "true");
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
  }

  /* —— Enter animation for view —— */
  function enterView() {
    if (prefersReducedMotion()) return;
    const view = document.querySelector(".nx-view");
    if (!view) return;
    const t = getTransition();
    view.classList.add(`is-entering-${t}`);
    const cleanup = () => view.classList.remove(`is-entering-${t}`);
    view.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, 1000);
  }

  /* —— Init —— */
  function init(options = {}) {
    applyStoredTheme();
    applyStoredTransition();
    document.body.classList.add("nx-body");

    if (!document.querySelector(".nx-view") && document.querySelector(".nx-app")) {
      document.querySelector(".nx-app").classList.add("nx-view");
    }

    markActiveNav();
    bindCrossDocumentVT();
    bindTransitionLinks();
    bindTransitionPicker();
    bindModals();
    bindTabs();
    bindVideoTriggers();

    if (options.audio !== false) bindAudioUi();
    if (options.audio === true) setAudioEnabled(true, { silent: true });

    if (options.particles !== false) initParticles();
    if (options.boot !== false) bootFlash();
    if (options.enter !== false) enterView();

    // Sync theme picker active state
    const theme = getTheme();
    document.querySelectorAll("[data-nx-set-theme]").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-nx-set-theme") === theme);
    });

    document.dispatchEvent(new CustomEvent("nx:ready"));
    return api;
  }

  const api = {
    init,
    setTheme,
    getTheme,
    setTransition,
    getTransition,
    transitions: TRANSITIONS,
    navigate: navigateWithTransition,
    openModal,
    closeModal,
    toast,
    setAudioEnabled,
    getAudioEnabled: () => audioEnabled,
    setAudioVolume,
    getAudioVolume,
    playSound,
    openVideo,
    closeVideo,
  };

  global.NexusUI = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body.hasAttribute("data-nx-auto") || document.documentElement.hasAttribute("data-nx-auto")) {
        init();
      }
    });
  } else if (document.body?.hasAttribute("data-nx-auto") || document.documentElement.hasAttribute("data-nx-auto")) {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);

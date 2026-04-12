/* ══════════════════════════════════════════════════════════
   HARRY POTTER MAGICAL INVITATION — JAVASCRIPT
   Modular vanilla JS — no frameworks
   ══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   CONFIG — Centralised settings
   ───────────────────────────────────────────── */
const CONFIG = {
  /* Event date for the countdown (YYYY-MM-DDTHH:MM:SS) */
  eventDate: '2026-03-20T01:40:00',

  /* Number of envelopes to spawn */
  envelopeCount: 10,

  /* Carousel auto-slide interval (ms) */
  carouselInterval: 4000,

  /* Particle count (scales down on mobile) */
  particleCount: 35,

  /* Footstep spawn interval (ms) */
  footstepInterval: 1200,
};

/* ─────────────────────────────────────────────
   UTILITY HELPERS
   ───────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Pause execution for `ms` milliseconds */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mark first user interaction (needed for audio autoplay) */
let hasInteracted = false;
const markInteraction = () => { hasInteracted = true; };

/* ═══════════════════════════════════════════════════════════
   MODULE 1 — ENVELOPE INTRO ANIMATION
   ═══════════════════════════════════════════════════════════ */
const IntroModule = (() => {
  const introScreen = $('#intro-screen');
  const container = $('#envelopes-container');
  const catchText = $('#catch-text');
  const tapText = $('#tap-text');
  const mainPage = $('#main-page');

  /** Create a single envelope DOM element */
  function createEnvelope(index) {
    const env = document.createElement('div');
    env.classList.add('envelope', 'falling');
    env.setAttribute('role', 'button');
    env.setAttribute('aria-label', `Envelope ${index + 1}`);
    env.setAttribute('tabindex', '0');

    // Random positioning & timing
    const left = 10 + Math.random() * 75; // 10–85% from left
    const fallDuration = 2.5 + Math.random() * 2; // 2.5–4.5s
    const fallDelay = Math.random() * 1.5;
    const rotStart = -25 + Math.random() * 50;
    const rotEnd = -15 + Math.random() * 30;
    const fallTarget = window.innerHeight * (0.35 + Math.random() * 0.45);

    env.style.cssText = `
      left: ${left}%;
      --fall-duration: ${fallDuration}s;
      --fall-delay: ${fallDelay}s;
      --rot-start: ${rotStart}deg;
      --rot-end: ${rotEnd}deg;
      --fall-target: ${fallTarget}px;
    `;

    env.innerHTML = `
      <div class="env-body">
        <div class="env-flap"></div>
        <div class="env-seal"></div>
      </div>
    `;

    // After fall animation ends → start floating
    env.addEventListener('animationend', () => {
      env.classList.remove('falling');
      env.classList.add('floating');
      env.style.top = `${fallTarget}px`;
    });

    // Click / tap handler
    env.addEventListener('click', () => selectEnvelope(env));
    env.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') selectEnvelope(env);
    });

    return env;
  }

  /** Handle envelope selection */
  async function selectEnvelope(env) {
    markInteraction();
    MusicModule.tryAutoplay();

    // Prevent double-taps
    if (env.classList.contains('selected')) {
      openEnvelope(env);
      return;
    }

    // Hide catch text
    catchText.classList.add('hidden');

    // Fade away other envelopes
    $$('.envelope', container).forEach((e) => {
      if (e !== env) e.classList.add('fade-away');
    });

    // Move selected to center
    env.classList.remove('floating');
    env.classList.add('selected');

    // Show "tap to open" after a beat
    await wait(900);
    tapText.classList.remove('hidden');
  }

  /** Open the selected envelope → transition directly to main page */
  async function openEnvelope(env) {
    tapText.classList.add('hidden');
    env.classList.add('opened');

    await wait(700);

    // Fade envelope out
    env.classList.add('fade-away');

    await wait(500);

    // Skip intermediate letter — go straight to main page
    introScreen.classList.add('fade-out');
    mainPage.classList.remove('hidden');

    await wait(100);
    mainPage.classList.add('visible');

    // Clean up intro after transition
    await wait(1300);
    introScreen.style.display = 'none';

    // Start main page modules
    CountdownModule.start();
    ParticlesModule.start();
    FootstepsModule.start();
    CarouselModule.init();
    RevealModule.init();
  }

  /** Initialise: spawn envelopes */
  function init() {
    for (let i = 0; i < CONFIG.envelopeCount; i++) {
      container.appendChild(createEnvelope(i));
    }
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 2 — COUNTDOWN TIMER
   ═══════════════════════════════════════════════════════════ */
const CountdownModule = (() => {
  const elDays = $('#countdown-days');
  const elHours = $('#countdown-hours');
  const elMins = $('#countdown-minutes');
  const elSecs = $('#countdown-seconds');
  let interval = null;
  let fireworksStarted = false;

  function update() {
    const now = Date.now();
    const target = new Date(CONFIG.eventDate).getTime();
    let totalDiff = target - now;

    if (totalDiff <= 0) {
      totalDiff = 0;
      if (!fireworksStarted) {
        fireworksStarted = true;
        if (interval) clearInterval(interval);
        FireworksModule.start();
      }
    }

    const d = Math.floor(totalDiff / 86400000);
    const h = Math.floor((totalDiff % 86400000) / 3600000);
    const m = Math.floor((totalDiff % 3600000) / 60000);
    const s = Math.floor((totalDiff % 60000) / 1000);

    elDays.textContent = String(d).padStart(2, '0');
    elHours.textContent = String(h).padStart(2, '0');
    elMins.textContent = String(m).padStart(2, '0');
    elSecs.textContent = String(s).padStart(2, '0');

    // Destapar las botellas progresivamente de a una
    if (d === 0) popBottle(elDays.closest('.potion-bottle'));
    if (d === 0 && h === 0) popBottle(elHours.closest('.potion-bottle'));
    if (d === 0 && h === 0 && m === 0) popBottle(elMins.closest('.potion-bottle'));
    if (totalDiff <= 0) popBottle(elSecs.closest('.potion-bottle'));
  }

  function popBottle(bottle) {
    if (!bottle || bottle.classList.contains('exploded')) return;
    
    bottle.classList.add('exploded');
    
    // Iniciar burbujas que rebalsan
    const neck = $('.bottle-neck', bottle);
    setInterval(() => {
      const bubble = document.createElement('div');
      bubble.classList.add('overflow-bubble');
      
      const size = 3 + Math.random() * 6;
      const duration = 1 + Math.random() * 0.8;
      const dx = -30 + Math.random() * 60;
      
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.animationDuration = duration + 's';
      bubble.style.setProperty('--dx', dx + 'px');
      
      neck.appendChild(bubble);
      
      setTimeout(() => bubble.remove(), duration * 1000);
    }, 150 + Math.random() * 100);
  }

  function start() {
    update();
    if (!fireworksStarted) {
      interval = setInterval(update, 1000);
    }
  }

  return { start };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 2.5 — FIREWORKS
   ═══════════════════════════════════════════════════════════ */
const FireworksModule = (() => {
  let canvas, ctx;
  let fireworks = [];
  let particles = [];
  let animFrame;

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '50'; 
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createFirework() {
    const x = canvas.width * 0.1 + Math.random() * (canvas.width * 0.8);
    const y = canvas.height;
    const targetY = canvas.height * 0.1 + Math.random() * (canvas.height * 0.4);
    const speed = 4 + Math.random() * 4;
    const hue = Math.floor(Math.random() * 360);
    
    fireworks.push({ x, y, targetY, speed, hue });
  }

  function explode(x, y, hue) {
    const count = 40 + Math.random() * 30;
    for(let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue: hue + (Math.random() * 30 - 15),
        brightness: 50 + Math.random() * 50,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.03
      });
    }
  }

  function animate() {
    // Fade existing drawing for trails
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'source-over';

    for(let i = fireworks.length - 1; i >= 0; i--) {
      let fw = fireworks[i];
      fw.y -= fw.speed;
      
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${fw.hue}, 100%, 60%)`;
      ctx.fill();
      
      if(fw.y <= fw.targetY) {
        explode(fw.x, fw.y, fw.hue);
        fireworks.splice(i, 1);
      }
    }
    
    for(let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.alpha -= p.decay;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, ${p.brightness}%, ${p.alpha})`;
      ctx.fill();
      
      if(p.alpha <= 0) particles.splice(i, 1);
    }
    
    animFrame = requestAnimationFrame(animate);
  }

  function start() {
    if (canvas) return; // already started
    init();
    animate();
    
    // Spawn for 8 seconds
    let sparkInterval = setInterval(createFirework, 400);
    setTimeout(() => {
      clearInterval(sparkInterval);
      // Wait for particles to fade then cleanup
      setTimeout(() => {
        cancelAnimationFrame(animFrame);
        if (canvas) {
          canvas.remove();
          canvas = null;
        }
      }, 4000);
    }, 8000);
  }

  return { start };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 3 — PARTICLE EFFECTS (Canvas)
   ═══════════════════════════════════════════════════════════ */
const ParticlesModule = (() => {
  const canvas = $('#particles-canvas');
  if (!canvas) return { start() {} };
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame = null;

  /** Resize canvas to fill viewport */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /** Create a single particle */
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.2 - Math.random() * 0.4,
      opacity: 0.2 + Math.random() * 0.5,
      hue: 35 + Math.random() * 25, // gold range
      life: 0,
      maxLife: 200 + Math.random() * 300,
    };
  }

  /** Animation loop */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.life++;

      // Fade based on lifecycle
      const progress = p.life / p.maxLife;
      const alpha = progress < 0.1
        ? p.opacity * (progress / 0.1)
        : progress > 0.8
          ? p.opacity * (1 - (progress - 0.8) / 0.2)
          : p.opacity;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha})`;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha * 0.15})`;
      ctx.fill();

      // Remove dead particles & respawn
      if (p.life >= p.maxLife) {
        particles[i] = createParticle();
      }
    }

    animFrame = requestAnimationFrame(animate);
  }

  function start() {
    resize();
    window.addEventListener('resize', resize);

    // Scale particle count for mobile
    const count = window.innerWidth < 600
      ? Math.floor(CONFIG.particleCount * 0.6)
      : CONFIG.particleCount;

    particles = Array.from({ length: count }, createParticle);
    animate();
  }

  return { start };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 4 — FOOTSTEPS ANIMATION
   ═══════════════════════════════════════════════════════════ */
const FootstepsModule = (() => {
  const layer = $('#footsteps-layer');
  if (!layer) return { start() {} };

  /* Footprint characters — alternating left/right */
  const prints = ['huellas.gif'];
  let stepIndex = 0;

  function getExcludedZone() {
    const el = document.querySelector('.map-rooms');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY
    };
  }

  function getNextPosition() {
    const w = document.documentElement.clientWidth;
    const scroll = window.scrollY;
    const viewH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const stepSize = w >= 1024 ? 300 : w >= 600 ? 250 : 200;
    const isDesktop = w >= 1024;
    const ex = getExcludedZone();

    for (let attempt = 0; attempt < 20; attempt++) {
      // Y: random within current viewport, clamped to document
      const y = scroll + Math.random() * (viewH - stepSize);
      const clampedY = Math.max(0, Math.min(y, docH - stepSize));

      let x;
      const currentSide = stepIndex % 2;
      
      // X: full random on desktop, left/right edges only on mobile
      if (isDesktop) {
        x = Math.random() * (w - stepSize);
      } else {
        x = currentSide === 0 ? Math.random() * 20 : w - stepSize - Math.random() * 20;
      }

      // Check if it overlaps with map-rooms
      if (ex) {
        const overlapX = x < ex.right && (x + stepSize) > ex.left;
        const overlapY = clampedY < ex.bottom && (clampedY + stepSize) > ex.top;
        if (overlapX && overlapY) {
          continue; // Skip this try and loop again
        }
      }

      stepIndex++;
      return { x, y: clampedY };
    }

    return null;
  }

  function spawnStep() {
    const pos = getNextPosition();
    if (!pos) return; // skip if viewport is past the allowed zone
    const step = document.createElement('div');
    step.classList.add('footstep');
    
    const img = document.createElement('img');
    img.src = prints[0]; // "huellas.gif"
    img.classList.add('footstep-img');

    step.appendChild(img);

    step.style.left = `${pos.x}px`;
    step.style.top = `${pos.y}px`;
    step.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(step);

    // Clean up after animation ends (match CSS animation duration)
    setTimeout(() => step.remove(), 4200);
  }

  function start() {
    setInterval(spawnStep, CONFIG.footstepInterval);
  }

  return { start };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 5 — PHOTO CAROUSEL
   ═══════════════════════════════════════════════════════════ */
const CarouselModule = (() => {
  const track = $('#carousel-track');
  const dotsContainer = $('#carousel-dots');
  if (!track || !dotsContainer) return { init() {} };

  let slides = [];
  let dots = [];
  let current = 0;
  let autoTimer = null;

  /* Touch / swipe state */
  let touchStartX = 0;
  let touchDeltaX = 0;
  let isDragging = false;

  /** Move the track to show slide `index` */
  function goTo(index) {
    current = ((index % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  /** Auto-slide next */
  function autoSlide() {
    goTo(current + 1);
  }

  function resetAutoplay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(autoSlide, CONFIG.carouselInterval);
  }

  /** Touch handlers for swipe */
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
    track.style.transition = 'none'; // disable transition while dragging
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    touchDeltaX = e.touches[0].clientX - touchStartX;
    const offset = -current * track.parentElement.offsetWidth + touchDeltaX;
    track.style.transform = `translateX(${offset}px)`;
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = ''; // re-enable transition

    const threshold = 50;
    if (touchDeltaX < -threshold) {
      goTo(current + 1);
    } else if (touchDeltaX > threshold) {
      goTo(current - 1);
    } else {
      goTo(current); // snap back
    }
    touchDeltaX = 0;
    resetAutoplay();
  }

  function init() {
    slides = $$('.carousel-slide', track);
    if (slides.length === 0) return;

    // Create dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goTo(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });

    // Touch events
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd);

    // Auto-slide
    autoTimer = setInterval(autoSlide, CONFIG.carouselInterval);
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 6 — MODALS
   ═══════════════════════════════════════════════════════════ */
const ModalsModule = (() => {
  function openModal(id) {
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus trap: focus the close button
    const closeBtn = $('.modal-close', modal);
    if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
  }

  function closeModal(modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.remove('active');
      modal.classList.remove('closing');
      document.body.style.overflow = '';
    }, 1800);
  }

  function init() {
    // Open buttons (both old magic-btn and new map-room buttons)
    $$('[data-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        markInteraction();
        MusicModule.tryAutoplay();
        openModal(btn.dataset.modal);

        // Init trivia if that modal
        if (btn.dataset.modal === 'modal-trivia') {
          TriviaModule.init();
        }
      });
    });

    // Close buttons
    $$('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
    });

    // Click backdrop to close
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // Escape key closes active modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const active = $('.modal-overlay.active');
        if (active) closeModal(active);
      }
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 7 — TRIVIA GAME
   ═══════════════════════════════════════════════════════════ */
const TriviaModule = (() => {
  const questions = [
    {
      q: '¿Cuál es el color favorito de Luchi?',
      options: ['Negro', 'Azul', 'Violeta', 'Rojo'],
      answer: 2,
    },
    {
      q: '¿Cuál es la comida favorita de Luchi?',
      options: ['Tarta de jamón y queso', 'Pizza', 'Milanesa con puré', 'Pastel de papa'],
      answer: 0,
    },
    {
      q: '¿Cuál es la película favorita de Luchi?',
      options: ['Avatar', 'Star Wars', 'Harry Potter', 'El señor de los anillos'],
      answer: 2,
    },
    {
      q: '¿Cuál es la banda favorita de Luchi?',
      options: ['Marama', 'Soda stereo', 'Tan bionica', 'Morat'],
      answer: 3,
    },
    {
      q: '¿Cuál es la bebida favorita de Luchi?',
      options: ['Pepsi', 'Fanta', '7up', 'Jugo'],
      answer: 1,
    },
    {
      q: '¿Cuál es la materia favorita de Luchi?',
      options: ['Lengua', 'Informática', 'Física', 'Matemática'],
      answer: 2,
    },
    {
      q: '¿Cuál es el pasatiempo de Luchi?',
      options: ['Dormir', 'Escribir', 'Manualidades', 'Dibujar'],
      answer: 3,
    },
    {
      q: '¿A dónde le gustaría viajar a Luchi?',
      options: ['España', 'Italia', 'Francia', 'Estados Unidos'],
      answer: 0,
    },
    {
      q: '¿De qué equipo es hincha Luchi?',
      options: ['Boca', 'River', 'San lorenzo', 'Vélez'],
      answer: 0,
    },
    {
      q: '¿Cuál es la estación favorita del año de Luchi?',
      options: ['Verano', 'Otoño', 'Invierno', 'Primavera'],
      answer: 1,
    },
    {
      q: '¿Cuál es la flor favorita de Luchi?',
      options: ['Tulipanes', 'Rosas', 'Dalias', 'Girasoles'],
      answer: 2,
    },
    {
      q: '¿Cuál es el signo zodiacal de Luchi?',
      options: ['Aries', 'Cáncer', 'Tauro', 'Géminis'],
      answer: 3,
    },
    {
      q: '¿Cuál es el animal favorito de Luchi?',
      options: ['Perro', 'Gato', 'Conejo', 'Tortuga'],
      answer: 1,
    },
    {
      q: '¿Cuál es el género favorito de películas de Luchi?',
      options: ['Romance', 'Terror', 'Ciencia ficción', 'Comedia'],
      answer: 0,
    },
    {
      q: '¿Cuál es la fruta favorita de Luchi?',
      options: ['Manzana', 'Banana', 'Naranja', 'Frutilla'],
      answer: 3,
    },
  ];

  let currentQ = 0;
  let score = 0;
  let answered = false;
  let playerName = '';
  let playerAnswers = [];   // track each answer
  let correctCount = 0;

  const elQuestion = $('#trivia-question');
  const elOptions = $('#trivia-options');
  const elFeedback = $('#trivia-feedback');
  const elNext = $('#trivia-next');
  const elScore = $('#trivia-score');
  const elNameForm = $('#trivia-name-form');
  const elNameInput = $('#trivia-player-name');
  const elStartBtn = $('#trivia-start-btn');
  const elGame = $('#trivia-game');

  function loadQuestion() {
    if (currentQ >= questions.length) {
      showFinalScore();
      return;
    }

    answered = false;
    const q = questions[currentQ];
    elQuestion.textContent = q.q;
    elFeedback.textContent = '';
    elNext.classList.add('hidden');
    elOptions.innerHTML = '';

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.classList.add('trivia-option');
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(i));
      elOptions.appendChild(btn);
    });

    elScore.textContent = `Pregunta ${currentQ + 1} de ${questions.length}`;
  }

  function selectAnswer(index) {
    if (answered) return;
    answered = true;

    const q = questions[currentQ];
    const buttons = $$('.trivia-option', elOptions);
    const chosenText = q.options[index];
    const isCorrect = index === q.answer;

    // Record the answer
    playerAnswers.push(chosenText);
    if (isCorrect) correctCount++;

    buttons.forEach((btn, i) => {
      btn.classList.add('disabled');
      if (i === q.answer) btn.classList.add('correct');
      if (i === index && i !== q.answer) btn.classList.add('wrong');
    });

    if (isCorrect) {
      score++;
      elFeedback.textContent = '✨ Correcto! +10 puntos';
      elFeedback.style.color = '#27ae60';
    } else {
      elFeedback.textContent = '❌ Noo! La respuesta correcta era: ' + q.options[q.answer];
      elFeedback.style.color = '#c0392b';
    }

    elNext.classList.remove('hidden');
  }

  function showFinalScore() {
    elQuestion.textContent = 'Trivia Completada!';
    elOptions.innerHTML = '';
    elFeedback.textContent = '';
    elNext.classList.add('hidden');

    const pct = Math.round((score / questions.length) * 100);
    let msg = '';
    if (pct === 100) msg = '¡Extraordinario! Ni el Mapa del Merodeador me conoce tan bien como tú';
    else if (pct >= 70) msg = '¡Supera las Expectativas! Eres un gran amigo, casi como un miembro del Ejército de Dumbledore';
    else if (pct >= 40) msg = '¡Aceptable! Un poco más de poción de memoria y me conocerás a la perfección';
    else msg = '¡Calificación: T de Trol! Tenemos que hablar más... ¿Nos vemos en las Tres Escobas?';

    elScore.innerHTML = `<strong>${score}/${questions.length}</strong> correcto (${pct}%)<br>${msg}`;

    // Send trivia results to Google Sheets
    sendTriviaResults();
  }

  function sendTriviaResults() {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWrAHdYBp3rhaBwSxV9rqZ8LeGPaF_uD2VgCIZZT6CYwDRoCMWT-Y1q9EaTC-blgHLjQ/exec';

    const payload = {
      type: 'trivia',
      name: playerName,
      score: score * 10,
      answers: playerAnswers,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      timestamp: new Date().toISOString(),
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => { /* silently fail */ });
  }

  function init() {
    currentQ = 0;
    score = 0;
    playerAnswers = [];
    correctCount = 0;

    // Show name form, hide game
    elNameForm.classList.remove('hidden');
    elGame.classList.add('hidden');

    // Start button handler
    elStartBtn.onclick = () => {
      const name = elNameInput.value.trim();
      if (!name) {
        elNameInput.classList.add('error');
        return;
      }
      elNameInput.classList.remove('error');
      playerName = name;
      elNameForm.classList.add('hidden');
      elGame.classList.remove('hidden');
      loadQuestion();
    };

    // "Next" button handler — re-bind to avoid duplication
    elNext.onclick = () => {
      currentQ++;
      loadQuestion();
    };
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 7.5 — PHOTOS UPLOAD
   ═══════════════════════════════════════════════════════════ */
const PhotosModule = (() => {
  const form = $('#photos-form');
  const input = $('#photos-input');
  const preview = $('#photos-preview');
  const status = $('#photos-status');
  const submitBtn = $('#photos-submit');
  const fileChosenText = $('#file-chosen-text');
  
  // Reemplazar con la URL de tu nuevo Web App de Google Apps Script 
  // (Este script debe estar configurado para recibir archivos en base64 y guardarlos en Drive)
  const UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbzUHJCclWbC0qDOnQ6NcxMO-SQ9LWFzsg7YNknfoY0iBNDUhh12yfZMC8XcCGfbtlsx/exec';

  let selectedFiles = [];

  function init() {
    if (!form || !input) return;

    input.addEventListener('change', (e) => {
      selectedFiles = Array.from(e.target.files);
      updatePreview();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (selectedFiles.length === 0) {
        setStatus('Por favor, selecciona al menos una foto', 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando Lechuzas...';
      setStatus('Procesando y subiendo tus fotos, no cierres esta ventana...', 'info');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        if (file.size > 5 * 1024 * 1024) {
          errorCount++;
          continue; // skip large files (>5MB)
        }

        try {
          const base64Data = await fileToBase64(file);
          // Separar la cabecera data:image/jpeg;base64, del contenido
          const base64Content = base64Data.split(',')[1];
          const mimeType = file.type;
          const filename = file.name;
          
          await fetch(UPLOAD_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'photo_upload',
              filename: filename,
              mimeType: mimeType,
              data: base64Content
            })
          });
          
          successCount++;
          setStatus(`Subida ${i+1} de ${selectedFiles.length}...`, 'info');
        } catch (err) {
          console.error(err);
          errorCount++;
        }
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Subir Fotos';
      
      if (successCount > 0 && errorCount === 0) {
        setStatus(`¡Travesura Realizada! ${successCount} foto(s) subida(s) con éxito.`, 'success');
        form.reset();
        selectedFiles = [];
        updatePreview();
      } else if (successCount > 0 && errorCount > 0) {
        setStatus(`Subidas ${successCount} fotos. ${errorCount} foto(s) fallaron (tal vez eran muy pesadas).`, 'info');
        form.reset();
        selectedFiles = [];
        updatePreview();
      } else {
        setStatus('Error oscuro detectado. No se pudieron subir las fotos. Quizás el Script URL no está configurado.', 'error');
      }
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  function updatePreview() {
    if (!fileChosenText) return;

    if (selectedFiles.length === 0) {
      fileChosenText.textContent = 'Ninguna foto seleccionada';
      if (preview) preview.innerHTML = ''; // Limpiamos si hay algo extra
    } else if (selectedFiles.length === 1) {
      fileChosenText.textContent = '1 recuerdo listo para enviar';
    } else {
      fileChosenText.textContent = `${selectedFiles.length} recuerdos listos para enviar`;
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = 'photos-status'; // reset classes
    if (type === 'error') status.classList.add('error-text');
    if (type === 'success') status.classList.add('success-text');
    if (type === 'info') status.classList.add('info-text');
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 8 — RSVP FORM
   ═══════════════════════════════════════════════════════════ */
const RSVPModule = (() => {
  const form = $('#rsvp-form');
  const successMsg = $('#rsvp-success');
  if (!form) return { init() {} };

  const peopleSelect = $('#rsvp-people');
  const dietContainer = $('#rsvp-diet-container');
  const addDietBtn = $('#rsvp-add-diet');

  function updateDietUI() {
    const peopleCount = parseInt(peopleSelect.value, 10);
    const dietItems = $$('.diet-item', dietContainer);
    
    let anySpecificDiet = false;

    // Automatically remove extra diet fields if people count is reduced
    if (dietItems.length > peopleCount) {
      for (let i = dietItems.length - 1; i >= peopleCount; i--) {
        dietItems[i].remove();
      }
    }

    // Refresh NodeList after removal
    const currentDietItems = $$('.diet-item', dietContainer);

    currentDietItems.forEach((item) => {
      const select = $('.diet-select', item);
      const nameInput = $('.diet-name', item);
      const hasDiet = select.value !== 'Ninguno';
      
      if (hasDiet) anySpecificDiet = true;

      // If more than 1 person and they selected a diet, require a name
      if (peopleCount > 1 && hasDiet) {
        nameInput.classList.remove('hidden');
        nameInput.setAttribute('required', 'required');
      } else {
        nameInput.classList.add('hidden');
        nameInput.removeAttribute('required');
      }
    });

    // Show "Add another person" if peopleCount > 1, at least one dietary requirement is entered, 
    // and we haven't reached the max people count
    if (peopleCount > 1 && anySpecificDiet && currentDietItems.length < peopleCount) {
      addDietBtn.classList.remove('hidden');
    } else {
      addDietBtn.classList.add('hidden');
    }
  }

  function getDietValue() {
    const peopleCount = parseInt(peopleSelect.value, 10);
    const dietItems = $$('.diet-item', dietContainer);

    let results = [];
    let allNinguno = true;

    dietItems.forEach((item) => {
      const diet = $('.diet-select', item).value;
      const name = $('.diet-name', item).value.trim() || 'Sin nombre';

      if (diet !== 'Ninguno') {
        allNinguno = false;
        if (peopleCount === 1) {
          results.push(diet); // Solo la dieta si es una persona
        } else {
          results.push(`{${name}, ${diet}}`); // Formato {Nombre, Dieta}
        }
      }
    });

    return allNinguno ? 'Ninguno' : results.join(', ');
  }

  function validate() {
    let valid = true;
    const required = $$('[required]', form);

    required.forEach((field) => {
      field.classList.remove('error');
      if (!field.value.trim()) {
        field.classList.add('error');
        valid = false;
      }
    });

    return valid;
  }

  function init() {
    if (peopleSelect) peopleSelect.addEventListener('change', updateDietUI);
    if (dietContainer) dietContainer.addEventListener('change', updateDietUI);

    if (addDietBtn) {
      addDietBtn.addEventListener('click', () => {
        const dietItems = $$('.diet-item', dietContainer);
        const template = dietItems[0].cloneNode(true);
        
        // Reset values in cloned node
        $('.diet-select', template).value = 'Ninguno';
        
        const nameInput = $('.diet-name', template);
        nameInput.value = '';
        nameInput.classList.add('hidden');
        nameInput.removeAttribute('required');

        // Optional: you could add an 'X' button here if you wanted allow removing specific lines, 
        // but for now they can just set it back to "Ninguno".

        dietContainer.appendChild(template);
        updateDietUI();
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validate()) return;

      // Collect form data (ready to send to a backend / Google Sheets)
      const rawPhone = form.phone ? form.phone.value : '';
      const data = {
        people: form.people.value,
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        phone: rawPhone.replace(/\s+/g, ''),
        attendance: form.attendance.value,
        diet: getDietValue(),
        song: form.song.value.trim(),
        message: form.message.value.trim(),
        timestamp: new Date().toISOString(),
      };

      /*
       * Google Apps Script web app URL.
       * Deploy the Apps Script from your Google Sheet and paste the URL here.
       */
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNch6a7a0KVZIZFzkVGcDMGIK6P9HbTzqNFFMpT7yvc4XMh-PPcqrcOT6l47RrKtp9/exec';

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rsvp',
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          people: data.people,
          attendance: data.attendance,
          diet: data.diet,
          song: data.song,
          message: data.message,
        }),
      }).then(() => {
        // Show success message
        form.style.display = 'none';
        successMsg.classList.remove('hidden');
      });
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 9 — BACKGROUND MUSIC
   ═══════════════════════════════════════════════════════════ */
const MusicModule = (() => {
  const audio = $('#bg-music');
  const btn = $('#music-toggle');
  if (!audio || !btn) return { init() {}, tryAutoplay() {} };

  let isPlaying = false;
  let hasTriedAutoplay = false;

  function play() {
    audio.volume = 0.3;
    audio.play().then(() => {
      isPlaying = true;
      btn.classList.add('playing');
      btn.classList.remove('paused');
    }).catch(() => {
      /* Autoplay blocked — user will click manually */
    });
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    btn.classList.remove('playing');
    btn.classList.add('paused');
  }

  function toggle() {
    if (isPlaying) pause(); else play();
  }

  /** Try to start playback after first interaction */
  function tryAutoplay() {
    if (hasTriedAutoplay) return;
    hasTriedAutoplay = true;
    play();
  }

  function init() {
    btn.classList.add('paused');
    btn.addEventListener('click', () => {
      markInteraction();
      toggle();
    });
  }

  return { init, tryAutoplay };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 10 — INTERSECTION OBSERVER REVEALS
   ═══════════════════════════════════════════════════════════ */
const RevealModule = (() => {
  function init() {
    // Add .reveal class to sections that should animate in
    $$('.countdown-section, .carousel-section, .buttons-section, .site-footer').forEach((el) => {
      el.classList.add('reveal');
    });

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      $$('.reveal').forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    $$('.reveal').forEach((el) => observer.observe(el));
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 11 — CONOCE TU MESA (SECRET AUDIO)
   ═══════════════════════════════════════════════════════════ */
const SecretAudioModule = (() => {
  const conoceMesaSection = $('#conoce-mesa-section');
  const fingerprintBtn = $('#fingerprint-btn');
  const fingerprintProgress = $('.fingerprint-wrapper');
  const introDiv = $('#conoce-mesa-intro');
  const resultDiv = $('#conoce-mesa-result');
  const statusEl = $('#conoce-mesa-status');
  const hatGif = $('#hat-gif-img');

  let holdTimer = null;
  let progress = 0;
  let holdInterval = null;
  let audioPlayer = null;

  const EXPECTED_URL = 'https://script.google.com/macros/s/AKfycbwNch6a7a0KVZIZFzkVGcDMGIK6P9HbTzqNFFMpT7yvc4XMh-PPcqrcOT6l47RrKtp9/exec';

  function checkVisibility() {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('inv');
    const id = params.get('id');

    const now = Date.now();
    const target = new Date(CONFIG.eventDate).getTime();
    const totalDiff = target - now;

    // Show if inv and id are present in URL, and <= 7 days left
    if (inv && id && totalDiff <= (7 * 86400000)) {
      conoceMesaSection.classList.remove('hidden');
    }
  }

  function spawnParticle() {
    if (!fingerprintProgress) return;
    const particle = document.createElement('div');
    particle.className = 'fingerprint-particle';
    
    // Random position around center
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 20; // outside the button
    const startX = 50 + Math.cos(angle) * 30; // Center is 50x50 inside wrapper
    const startY = 50 + Math.sin(angle) * 30;
    
    // Target position (floating up and out)
    const tx = (Math.cos(angle) * distance) + 'px';
    const ty = (Math.sin(angle) * distance - 30) + 'px'; // Move up slightly
    
    particle.style.left = startX + 'px';
    particle.style.top = startY + 'px';
    particle.style.setProperty('--tx', tx);
    particle.style.setProperty('--ty', ty);
    
    fingerprintProgress.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 800);
  }

  function startHold(e) {
    if (e.type !== 'mousedown' && e.type !== 'touchstart') return;
    progress = 0;
    
    // Clear previous
    if (holdInterval) clearInterval(holdInterval);
    
    holdInterval = setInterval(() => {
      progress += 2;
      if (fingerprintProgress) fingerprintProgress.style.setProperty('--progress', progress + '%');
      
      // Spawn magic particles
      if (Math.random() > 0.5) spawnParticle();
      
      if (progress >= 100) {
        clearInterval(holdInterval);
        triggerMagic();
      }
    }, 30);
  }

  function stopHold() {
    clearInterval(holdInterval);
    if (progress < 100) {
      progress = 0;
      if (fingerprintProgress) fingerprintProgress.style.setProperty('--progress', '0%');
    }
  }

  async function triggerMagic() {
    introDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    statusEl.textContent = 'Consultando al sombrero...';

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    let audioName = params.get('inv') || 'defecto';
    let numeroMesa = null;

    try {
      // Intentamos traer el audio y la mesa del id
      const resp = await fetch(`${EXPECTED_URL}?action=getAudio&id=${id}`);
      const data = await resp.json();
      
      if (data) {
        if (data.audioName) audioName = data.audioName;
        
        // Extraemos el número de la mesa
        if (data.mesa) {
           const match = String(data.mesa).match(/\d+/);
           if (match) numeroMesa = match[0];
           else numeroMesa = data.mesa;
        }
      }
    } catch (e) {
      // Fallback
    }

    playAudio(audioName, numeroMesa);
  }

  function playAudio(name, numeroMesa) {
    const audioSrc = `audios/${name}.mp3`;
    if (audioPlayer) audioPlayer.pause();
    
    audioPlayer = new Audio(audioSrc);
    
    // Listeners para iniciar animación cuando empiece el audio
    audioPlayer.addEventListener('play', () => {
       if (hatGif) hatGif.classList.remove('hidden');
       statusEl.textContent = 'Encontrando tu mesa...';
    });

    audioPlayer.play().catch(e => {
        statusEl.innerHTML += `<br><button class="magic-btn magic-btn--small" onclick="const a = this.nextElementSibling; a.play(); this.remove();">Magia revelada (toca para escuchar)</button><audio controls src="${audioSrc}" style="display:none"></audio>`;
    });

    audioPlayer.onended = () => {
      if (hatGif) hatGif.classList.add('hidden');
      statusEl.textContent = "Travesura realizada. ¡Mirá el mapa!";
      
      // Llamar al mapa
      MapAnimationModule.revelarMesa(numeroMesa || 1); // default mesa 1
    };
  }

  function init() {
    if (!conoceMesaSection) return;
    checkVisibility();
    
    if (fingerprintBtn) {
      ['mousedown', 'touchstart'].forEach(type => fingerprintBtn.addEventListener(type, startHold, {passive: true}));
      ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(type => fingerprintBtn.addEventListener(type, stopHold, {passive: true}));
    }
  }

  return { init, checkVisibility };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 12 — MAPA Y HUELLAS (MAP ANIMATION)
   ═══════════════════════════════════════════════════════════ */
const MapAnimationModule = (() => {
  const mapContainer = $('#conoce-mesa-mapa');
  const pathsContainer = $('#map-paths-container');
  
  function createFootprint(x, y, isRight, angle) {
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#huella-original');
    use.setAttribute('class', 'huella-merodeador');
    
    // El SVG original apunta al Eje X (derecha). 
    // Para que parezcan patas alternadas usamos scaleY(-1) para el pie izquierdo.
    const scaleY = isRight ? -1 : 1;
    use.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle}) scale(1, ${scaleY})`);
    
    return use;
  }

  function getPathSegments(tableX, tableY) {
    let pts = [];
    let startX = 200;
    let startY = 440;
    
    let isLeft = tableX < 200;
    let turnRadius = 25;
    let turnStartY = tableY + turnRadius;
    if (turnStartY > startY) turnStartY = startY; 
    
    pts.push({x: startX, y: startY});
    pts.push({x: startX, y: turnStartY});
    
    // Curva suave
    let curveSteps = 5;
    for(let i=1; i<=curveSteps; i++) {
        let t = i / curveSteps; 
        let a = t * (Math.PI / 2); 
        // Si va a la izq, el centro del giro está en la izquierda. Si va a la der, en la derecha.
        let curX = startX + (isLeft ? -turnRadius * (1 - Math.cos(a)) : turnRadius * (1 - Math.cos(a)));
        let curY = turnStartY - turnRadius * Math.sin(a);
        pts.push({x: curX, y: curY});
    }
    
    // Segmento horizontal hasta la mesa
    let endX = tableX + (isLeft ? 45 : -45); 
    pts.push({x: endX, y: tableY});
    
    return pts;
  }
  
  function generarHuellas(pts) {
    let footprints = [];
    let stepLength = 17; // Distancia exacta misma de styles.css
    let leftOver = 0;
    let isRight = false; // Empezamos con un pie
    
    for (let i = 0; i < pts.length - 1; i++) {
      let p1 = pts[i];
      let p2 = pts[i+1];
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = Math.hypot(dx, dy);
      if (dist === 0) continue;
      
      let dirX = dx / dist;
      let dirY = dy / dist;
      let angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      let currentD = leftOver;
      while (currentD < dist) {
        let cx = p1.x + dirX * currentD;
        let cy = p1.y + dirY * currentD;
        
        let perpX = -dirY;
        let perpY = dirX;
        
        let sideOffset = isRight ? 6 : -6;
        
        footprints.push({
          x: cx + perpX * sideOffset,
          y: cy + perpY * sideOffset,
          isRight: isRight,
          angle: angle
        });
        
        isRight = !isRight;
        currentD += stepLength;
      }
      leftOver = currentD - dist;
    }
    return footprints;
  }

  function revelarMesa(numeroMesa) {
    if (!mapContainer || !pathsContainer) return;
    mapContainer.classList.remove('hidden');
    pathsContainer.innerHTML = '';
    
    $$('.mesa-salon').forEach(m => m.classList.remove('mesa-asignada'));
    const target = $(`#mesa-${numeroMesa}`);
    if (!target) return;
    
    target.classList.add('mesa-asignada');
    
    const cx = parseFloat(target.getAttribute('cx'));
    const cy = parseFloat(target.getAttribute('cy'));
    
    const pts = getPathSegments(cx, cy);
    const footprints = generarHuellas(pts);
    
    footprints.forEach((fp, i) => {
      const el = createFootprint(fp.x, fp.y, fp.isRight, fp.angle);
      pathsContainer.appendChild(el);
      
      setTimeout(() => {
        el.classList.add('visible');
      }, i * 300);
    });
  }

  return { revelarMesa };
})();

/* ═══════════════════════════════════════════════════════════
   MODULE 13 — REGALOS (COPY ALIAS)
   ═══════════════════════════════════════════════════════════ */
const GiftsModule = (() => {
  function init() {
    const copyBtn = $('#copy-alias-btn');
    const aliasText = $('#alias-text');
    const copyStatus = $('#copy-status');

    if (!copyBtn || !aliasText || !copyStatus) return;

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(aliasText.textContent.trim());
        copyStatus.classList.remove('hidden');
        setTimeout(() => {
          copyStatus.classList.add('hidden');
        }, 2000);
      } catch (err) {
        console.error('Error al copiar el alias', err);
      }
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Start the intro envelope animation */
  IntroModule.init();

  /* Initialise non-visual modules immediately */
  ModalsModule.init();
  RSVPModule.init();
  PhotosModule.init();
  MusicModule.init();
  if (typeof SecretAudioModule !== 'undefined') SecretAudioModule.init();
  if (typeof GiftsModule !== 'undefined') GiftsModule.init();

  /*
   * The following modules are started AFTER the intro
   * completes (triggered inside IntroModule.openEnvelope):
   *   - CountdownModule.start()
   *   - ParticlesModule.start()
   *   - FootstepsModule.start()
   *   - CarouselModule.init()
   *   - RevealModule.init()
   */
});

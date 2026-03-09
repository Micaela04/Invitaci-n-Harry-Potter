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
  eventDate: '2026-06-04T21:00:00',

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
  const letterContent = $('#letter-content');
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
    catchText.classList.add('hidden-anim');

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

  /** Open the selected envelope → reveal letter → transition to main */
  async function openEnvelope(env) {
    tapText.classList.add('hidden');
    env.classList.add('opened');

    await wait(700);

    // Fade envelope out
    env.classList.add('fade-away');

    await wait(500);

    // Show letter content
    letterContent.classList.remove('hidden');

    // After reading time → transition
    await wait(3500);

    letterContent.style.transition = 'opacity 1.2s ease';
    letterContent.style.opacity = '0';

    await wait(1200);

    // Hide intro, show main
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

  function update() {
    const now = Date.now();
    const target = new Date(CONFIG.eventDate).getTime();
    let diff = Math.max(0, target - now);

    const d = Math.floor(diff / 86400000); diff %= 86400000;
    const h = Math.floor(diff / 3600000); diff %= 3600000;
    const m = Math.floor(diff / 60000); diff %= 60000;
    const s = Math.floor(diff / 1000);

    elDays.textContent = String(d).padStart(2, '0');
    elHours.textContent = String(h).padStart(2, '0');
    elMins.textContent = String(m).padStart(2, '0');
    elSecs.textContent = String(s).padStart(2, '0');

    if (diff <= 0 && interval) clearInterval(interval);
  }

  function start() {
    update();
    interval = setInterval(update, 1000);
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

  /* Walking path: coordinates along border of the viewport */
  function getNextPosition() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scroll = window.scrollY;
    const pad = 30;

    // Walk along 4 borders in a cycle
    const side = stepIndex % 4;
    stepIndex++;

    switch (side) {
      case 0: // top border
        return { x: pad + Math.random() * (w - pad * 2), y: scroll + pad + Math.random() * 40 };
      case 1: // right border
        return { x: w - pad - Math.random() * 40, y: scroll + pad + Math.random() * (h - pad * 2) };
      case 2: // bottom border
        return { x: pad + Math.random() * (w - pad * 2), y: scroll + h - pad - Math.random() * 40 };
      case 3: // left border
        return { x: pad + Math.random() * 40, y: scroll + pad + Math.random() * (h - pad * 2) };
    }
  }

  function spawnStep() {
    const pos = getNextPosition();
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
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function init() {
    // Open buttons
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
      q: 'What is the name of Harry Potter\'s owl?',
      options: ['Errol', 'Hedwig', 'Pigwidgeon', 'Scabbers'],
      answer: 1,
    },
    {
      q: 'Which house does the Sorting Hat place Harry in?',
      options: ['Ravenclaw', 'Hufflepuff', 'Slytherin', 'Gryffindor'],
      answer: 3,
    },
    {
      q: 'What is the core of Harry\'s wand?',
      options: ['Dragon heartstring', 'Unicorn tail hair', 'Phoenix feather', 'Thestral tail'],
      answer: 2,
    },
    {
      q: 'What spell disarms an opponent?',
      options: ['Stupefy', 'Expelliarmus', 'Petrificus Totalus', 'Obliviate'],
      answer: 1,
    },
    {
      q: 'What position does Harry play in Quidditch?',
      options: ['Keeper', 'Chaser', 'Beater', 'Seeker'],
      answer: 3,
    },
    {
      q: 'Who is the Half-Blood Prince?',
      options: ['Draco Malfoy', 'Tom Riddle', 'Severus Snape', 'Albus Dumbledore'],
      answer: 2,
    },
    {
      q: 'What creature guards the Philosopher\'s Stone?',
      options: ['A Dragon', 'A Basilisk', 'A three-headed dog', 'A Sphinx'],
      answer: 2,
    },
    {
      q: 'What is the name of the wizarding bank?',
      options: ['Ollivanders', 'Flourish & Blotts', 'Gringotts', 'The Leaky Cauldron'],
      answer: 2,
    },
  ];

  let currentQ = 0;
  let score = 0;
  let answered = false;

  const elQuestion = $('#trivia-question');
  const elOptions = $('#trivia-options');
  const elFeedback = $('#trivia-feedback');
  const elNext = $('#trivia-next');
  const elScore = $('#trivia-score');

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

    elScore.textContent = `Question ${currentQ + 1} of ${questions.length}`;
  }

  function selectAnswer(index) {
    if (answered) return;
    answered = true;

    const q = questions[currentQ];
    const buttons = $$('.trivia-option', elOptions);

    buttons.forEach((btn, i) => {
      btn.classList.add('disabled');
      if (i === q.answer) btn.classList.add('correct');
      if (i === index && i !== q.answer) btn.classList.add('wrong');
    });

    if (index === q.answer) {
      score++;
      elFeedback.textContent = '✨ Correct! +10 points';
      elFeedback.style.color = '#27ae60';
    } else {
      elFeedback.textContent = '❌ Wrong! The correct answer was: ' + q.options[q.answer];
      elFeedback.style.color = '#c0392b';
    }

    elNext.classList.remove('hidden');
  }

  function showFinalScore() {
    elQuestion.textContent = 'Trivia Complete!';
    elOptions.innerHTML = '';
    elFeedback.textContent = '';
    elNext.classList.add('hidden');

    const pct = Math.round((score / questions.length) * 100);
    let msg = '';
    if (pct === 100) msg = '🏆 Outstanding! A true witch/wizard!';
    else if (pct >= 70) msg = '⚡ Excellent! Dumbledore would be proud!';
    else if (pct >= 40) msg = '📚 Not bad! Keep studying your spellbooks.';
    else msg = '🧙 You might need to retake your O.W.L.s!';

    elScore.innerHTML = `<strong>${score}/${questions.length}</strong> correct (${pct}%)<br>${msg}`;
  }

  function init() {
    currentQ = 0;
    score = 0;
    loadQuestion();

    // "Next" button handler — re-bind to avoid duplication
    elNext.onclick = () => {
      currentQ++;
      loadQuestion();
    };
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validate()) return;

      // Collect form data (ready to send to a backend / Google Sheets)
      const data = {
        people: form.people.value,
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        attendance: form.attendance.value,
        diet: form.diet.value,
        song: form.song.value.trim(),
        message: form.message.value.trim(),
        timestamp: new Date().toISOString(),
      };

      /*
       * Google Apps Script web app URL.
       * Deploy the Apps Script from your Google Sheet and paste the URL here.
       */
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcNy7RnPQNGcbgK6NDMvZ7tLS4RYcZODowOvMOaAcLgsb2Q-1Vlrp1aGmJcxldgTfU/exec';

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          people: data.people,
          attendance: data.attendance,
          diet: data.diet,
          song: data.song,
          message: data.message,
        }),
      });

      // Show success message
      form.style.display = 'none';
      successMsg.classList.remove('hidden');
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
   INITIALISATION
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Start the intro envelope animation */
  IntroModule.init();

  /* Initialise non-visual modules immediately */
  ModalsModule.init();
  RSVPModule.init();
  MusicModule.init();

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
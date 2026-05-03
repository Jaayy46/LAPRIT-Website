// ─── JS Loaded (enables reveal animations safely) ───────────────
document.body.classList.add('js-loaded');

// ─── Scroll Progress Bar ────────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

// ─── Custom Cursor with Context Labels ──────────────────────────
const cursor      = document.getElementById('cursor');
const cursorRing  = document.getElementById('cursor-ring');
const cursorLabel = document.getElementById('cursor-label');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
}, { passive: true });

(function animateCursor() {
  ringX += (mouseX - ringX) * 0.1;
  ringY += (mouseY - ringY) * 0.1;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateCursor);
})();

function setCursorLabel(text) {
  cursorLabel.textContent = text;
  document.body.classList.add('cursor-hover', 'cursor-labeled');
}
function clearCursorLabel() {
  document.body.classList.remove('cursor-hover', 'cursor-labeled');
}

// Standard hover (links & buttons without a label)
document.querySelectorAll('a:not(.gallery-item a):not(.btn-gold), button, .song-item, .video-thumb').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (!document.body.classList.contains('cursor-labeled'))
      document.body.classList.add('cursor-hover');
  });
  el.addEventListener('mouseleave', () => {
    if (!document.body.classList.contains('cursor-labeled'))
      document.body.classList.remove('cursor-hover');
  });
});

// Labeled hovers
document.querySelectorAll('.gallery-item').forEach(el => {
  el.addEventListener('mouseenter', () => setCursorLabel('ZOOM'));
  el.addEventListener('mouseleave', clearCursorLabel);
});
document.querySelectorAll('.album-card').forEach(el => {
  el.addEventListener('mouseenter', () => setCursorLabel('ALBUM'));
  el.addEventListener('mouseleave', clearCursorLabel);
});
document.querySelectorAll('.btn-gold').forEach(el => {
  el.addEventListener('mouseenter', () => setCursorLabel('PLAY'));
  el.addEventListener('mouseleave', clearCursorLabel);
});

// ─── Nav Scroll + Active Link ────────────────────────────────────
const nav      = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// ─── Parallax Hero ──────────────────────────────────────────────
const heroBg = document.getElementById('hero-bg');
window.addEventListener('scroll', () => {
  const offset = window.scrollY;
  if (offset < window.innerHeight) {
    heroBg.style.transform = `scale(1.05) translateY(${offset * 0.25}px)`;
  }
}, { passive: true });

// ─── Scroll Reveal ──────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── Stats Counter ───────────────────────────────────────────────
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.stat-value').forEach(el => {
      const raw   = el.textContent.trim();
      const match = raw.match(/^(\d+)(\D*)$/);
      if (!match) return;
      const target   = parseInt(match[1]);
      const suffix   = match[2] || '';
      const start    = target > 100 ? target - 30 : 0;
      const duration = 1400;
      const t0       = performance.now();

      function tick(now) {
        const p    = Math.min((now - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(start + (target - start) * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.about-stats').forEach(el => counterObserver.observe(el));

// ─── Album Card 3D Tilt ──────────────────────────────────────────
document.querySelectorAll('.album-card').forEach(card => {
  const cover = card.querySelector('.album-cover');

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)  / r.width  - 0.5;
    const y = (e.clientY - r.top)   / r.height - 0.5;
    card.style.transform =
      `perspective(500px) rotateY(${x * 18}deg) rotateX(${y * -18}deg) translateY(-8px) scale(1.03)`;
    if (cover) {
      const glow = cover.querySelector('.album-glow');
      if (glow) glow.style.background =
        `radial-gradient(ellipse at ${50 + x * 60}% ${50 + y * 60}%, rgba(137,196,225,0.18), transparent 65%)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    const glow = card.querySelector('.album-glow');
    if (glow) glow.style.background = '';
  });
});

// ─── Gallery Lightbox ────────────────────────────────────────────
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

document.querySelectorAll('.gallery-item img').forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 400);
}
lightbox.addEventListener('click', e => { if (e.target !== lightboxImg) closeLightbox(); });
lightboxClose.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ─── Hamburger ───────────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ─── Contact Form ─────────────────────────────────────────────────
const form        = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

form.addEventListener('submit', e => {
  e.preventDefault();
  form.style.display = 'none';
  formSuccess.classList.add('show');
});

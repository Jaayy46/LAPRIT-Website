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

// ─── Album Card 3D Tilt (skip cards handled by Three.js) ─────────
document.querySelectorAll('.album-card:not([data-no-tilt])').forEach(card => {
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

// ─── Three.js Trust Album 3D ─────────────────────────────────────
function initTrustAlbum() {
  const canvas = document.getElementById('trust-album-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const parent = canvas.parentElement;
  const W = parent.offsetWidth  || 200;
  const H = parent.offsetHeight || 200;
  const DPR = Math.min(window.devicePixelRatio, 2);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(DPR);

  // Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
  camera.position.set(0, 0, 3.4);

  // ── Canvas texture for album art ──────────────────────────────
  const texSize = 512;
  const tc = document.createElement('canvas');
  tc.width = tc.height = texSize;
  const ctx = tc.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, texSize, texSize);
  bg.addColorStop(0,   '#1a1206');
  bg.addColorStop(0.5, '#090806');
  bg.addColorStop(1,   '#1c1408');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, texSize, texSize);

  // Radial glow center
  const rg = ctx.createRadialGradient(256, 210, 10, 256, 210, 230);
  rg.addColorStop(0,   'rgba(201,168,76,0.18)');
  rg.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, texSize, texSize);

  // Thin cross (matching site design)
  ctx.save();
  ctx.strokeStyle = 'rgba(201,168,76,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 110); ctx.lineTo(256, 290); // vertical
  ctx.moveTo(186, 170); ctx.lineTo(326, 170); // crossbar
  ctx.stroke();
  ctx.restore();

  // TRUST text
  ctx.fillStyle = '#f0eeeb';
  ctx.font = '300 108px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('TRUST', 256, 395);

  // LAPRIT label
  ctx.fillStyle = 'rgba(201,168,76,0.65)';
  ctx.font = '400 22px "Barlow", Arial, sans-serif';
  ctx.letterSpacing = '0.25em';
  ctx.fillText('LAPRIT', 256, 432);

  // Border frame
  ctx.strokeStyle = 'rgba(201,168,76,0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, texSize - 32, texSize - 32);

  const texture = new THREE.CanvasTexture(tc);

  // ── Geometry & Materials ───────────────────────────────────────
  const geo = new THREE.BoxGeometry(1.8, 1.8, 0.045);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1206, roughness: 0.8, metalness: 0.1 });
  const front = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.25, metalness: 0.15 });
  const back  = new THREE.MeshStandardMaterial({ color: 0x0d0c08, roughness: 0.9 });
  // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
  const mats = [dark, dark, dark, dark, front, back];
  const album = new THREE.Mesh(geo, mats);
  scene.add(album);

  // ── Lighting ──────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x89c4e1, 0.35);
  rimLight.position.set(-3, -1, -3);
  scene.add(rimLight);

  const goldSpot = new THREE.PointLight(0xc9a84c, 0.7, 6);
  goldSpot.position.set(0.5, 1.5, 2.5);
  scene.add(goldSpot);

  // ── Interaction ────────────────────────────────────────────────
  let targetY = 0.25, targetX = 0;
  let isHover = false;
  const card = canvas.closest('.album-card');

  if (card) {
    card.addEventListener('mouseenter', () => { isHover = true; });
    card.addEventListener('mouseleave', () => {
      isHover = false;
      targetY = 0.25;
      targetX = 0;
    });
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      targetY =  ((e.clientX - r.left) / r.width  - 0.5) * 1.2;
      targetX = -((e.clientY - r.top)  / r.height - 0.5) * 0.8;
    });
  }

  // ── Animate ────────────────────────────────────────────────────
  let autoY = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (isHover) {
      album.rotation.y += (targetY - album.rotation.y) * 0.07;
      album.rotation.x += (targetX - album.rotation.x) * 0.07;
    } else {
      autoY += 0.004;
      album.rotation.y += (autoY - album.rotation.y) * 0.03;
      album.rotation.x += (0    - album.rotation.x) * 0.05;
    }
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ────────────────────────────────────────────────────
  new ResizeObserver(() => {
    const W = parent.offsetWidth;
    const H = parent.offsetHeight;
    if (W && H) {
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
  }).observe(parent);
}

// Init after fonts + Three.js are ready
if (document.fonts) {
  document.fonts.ready.then(initTrustAlbum);
} else {
  window.addEventListener('load', initTrustAlbum);
}

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

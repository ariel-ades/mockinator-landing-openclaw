// ── MOBILE NAV TOGGLE ──────────────────────────────────────────────────────
(function () {
  const hamburger = document.getElementById('nav-hamburger');
  const overlay   = document.getElementById('nav-mobile-overlay');
  if (!hamburger || !overlay) return;

  function openNav() {
    overlay.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Move focus to first link for keyboard users
    const firstLink = overlay.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeNav() {
    overlay.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeNav() : openNav();
  });

  // Close when a nav link is clicked (smooth-scroll targets)
  overlay.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeNav();
    }
  });

  // Close if viewport is resized to desktop width
  const mq = window.matchMedia('(min-width: 769px)');
  mq.addEventListener('change', e => { if (e.matches) closeNav(); });
})();

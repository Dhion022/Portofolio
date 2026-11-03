/**
 * PORTFOLIO — script.js
 * ============================================================
 * Fitur:
 * 1.  Theme toggle (dark/light) + localStorage persistence
 * 2.  Navbar: scroll state, active link highlight
 * 3.  Mobile hamburger menu
 * 4.  Smooth scrolling (enhanced — handles offset for fixed navbar)
 * 5.  Scroll reveal animation (IntersectionObserver)
 * 6.  Typing animation (Hero section)
 * 7.  Skill bar animation (IntersectionObserver)
 * 8.  Counter animation (About section stats)
 * 9.  Contact form validation + mailto fallback
 * 10. Copyright year (auto)
 * 11. Back-to-top button
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITY HELPERS
============================================================ */

/**
 * Shorthand querySelector.
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll — returns an Array.
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Check if the user prefers reduced motion.
 * @returns {boolean}
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   1. THEME TOGGLE
   Persists preference in localStorage under 'portfolio-theme'.
   Applies data-theme attribute to <html>.
============================================================ */
const ThemeManager = (() => {
  const STORAGE_KEY = 'portfolio-theme';
  const DEFAULT_THEME = 'dark';

  /** @returns {'dark'|'light'} */
  function getSaved() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }

  /** @param {'dark'|'light'} theme */
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update aria-label on toggle button
    const btn = $('#themeToggle');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'
      );
    }
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    // Apply saved theme immediately (before paint, no flash)
    apply(getSaved());

    const btn = $('#themeToggle');
    if (btn) {
      btn.addEventListener('click', toggle);

      // Keyboard: space/enter already fire click on <button>.
      // Extra: animate icon on toggle
      btn.addEventListener('click', () => {
        btn.style.transform = 'scale(0.85)';
        requestAnimationFrame(() => {
          setTimeout(() => { btn.style.transform = ''; }, 150);
        });
      });
    }
  }

  return { init };
})();


/* ============================================================
   2. NAVBAR — Scroll State & Active Section Highlight
============================================================ */
const NavbarManager = (() => {
  const SCROLL_THRESHOLD = 60; // px before navbar gets glass effect

  function updateScrollState() {
    const navbar = $('#navbar');
    if (!navbar) return;

    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }

  function updateActiveLink() {
    // Collect all sections that have a matching nav link
    const sections = $$('section[id], header[id]');
    const navLinks = $$('.navbar__link, .navbar__mobile-link');

    if (!sections.length || !navLinks.length) return;

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'),
      10
    ) || 68;

    // Find the section whose top edge is closest to the navbar bottom
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop <= navHeight + 32) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const targetSection = link.getAttribute('data-section');
      link.classList.toggle('is-active', targetSection === currentId);
    });
  }

  function init() {
    updateScrollState();
    updateActiveLink();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollState();
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  return { init };
})();


/* ============================================================
   3. MOBILE HAMBURGER MENU
============================================================ */
const MobileMenuManager = (() => {
  function init() {
    const hamburger  = $('#hamburger');
    const mobileMenu = $('#mobileMenu');
    const mobileLinks = $$('.navbar__mobile-link');

    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      hamburger.classList.add('is-open');
      mobileMenu.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // prevent body scroll while menu open
    }

    function closeMenu() {
      hamburger.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function toggleMenu() {
      const isOpen = hamburger.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    }

    hamburger.addEventListener('click', toggleMenu);

    // Close when a link is clicked
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close when clicking outside the menu
    document.addEventListener('click', e => {
      const navbar = $('#navbar');
      if (navbar && !navbar.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  return { init };
})();


/* ============================================================
   4. SMOOTH SCROLLING
   Handles all anchor links that point to #id targets.
   Accounts for fixed navbar height.
============================================================ */
const SmoothScrollManager = (() => {
  function scrollToTarget(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'),
      10
    ) || 68;

    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  function init() {
    // Let the browser handle scroll-padding-top for accessibility,
    // but override with JS for precise control.
    document.addEventListener('click', e => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = href.slice(1);
      if (!targetId) return;

      // Only prevent default if target exists on this page
      if (document.getElementById(targetId)) {
        e.preventDefault();
        scrollToTarget(targetId);

        // Update URL hash without triggering a jump
        history.pushState(null, '', href);
      }
    });
  }

  return { init };
})();


/* ============================================================
   5. SCROLL REVEAL ANIMATION
   Uses IntersectionObserver to add .is-visible to [data-reveal]
   elements as they enter the viewport.
============================================================ */
const ScrollRevealManager = (() => {
  function init() {
    if (prefersReducedMotion()) {
      // Skip animation; show everything immediately
      $$('[data-reveal]').forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    $$('[data-reveal]').forEach(el => observer.observe(el));
  }

  return { init };
})();


/* ============================================================
   6. TYPING ANIMATION (Hero Section)
   Cycles through an array of role strings with
   character-by-character typing and erasing effect.
============================================================ */
const TypingAnimation = (() => {
  // Edit this array to change the typed roles
  const ROLES = [
    'Mahasiswa Sistem Informasi',
    'Pengembang Web',
    'Penggiat Teknologi',
    'Pemecah Masalah',
    'Analis Sistem',
  ];

  const TYPING_SPEED   = 80;   // ms per character (typing)
  const ERASING_SPEED  = 40;   // ms per character (erasing)
  const PAUSE_AFTER_TYPE  = 2000; // ms pause after fully typed
  const PAUSE_AFTER_ERASE =  400; // ms pause before typing next

  let currentIndex = 0;
  let charIndex     = 0;
  let isErasing     = false;
  let timeoutId     = null;

  function tick() {
    const typedEl = $('#typedText');
    if (!typedEl) return;

    const currentRole = ROLES[currentIndex];

    if (!isErasing) {
      // Typing forward
      charIndex++;
      typedEl.textContent = currentRole.slice(0, charIndex);

      if (charIndex === currentRole.length) {
        // Fully typed — pause then start erasing
        isErasing = true;
        timeoutId = setTimeout(tick, PAUSE_AFTER_TYPE);
        return;
      }
    } else {
      // Erasing backward
      charIndex--;
      typedEl.textContent = currentRole.slice(0, charIndex);

      if (charIndex === 0) {
        // Fully erased — move to next role
        isErasing = false;
        currentIndex = (currentIndex + 1) % ROLES.length;
        timeoutId = setTimeout(tick, PAUSE_AFTER_ERASE);
        return;
      }
    }

    const speed = isErasing ? ERASING_SPEED : TYPING_SPEED;
    // Add slight variance so typing feels more natural
    const variance = Math.random() * 30 - 15;
    timeoutId = setTimeout(tick, speed + variance);
  }

  function init() {
    const typedEl = $('#typedText');
    if (!typedEl) return;

    if (prefersReducedMotion()) {
      // Just show the first role statically
      typedEl.textContent = ROLES[0];
      return;
    }

    // Start after a short delay so other hero animations settle
    timeoutId = setTimeout(tick, 1200);
  }

  return { init };
})();


/* ============================================================
   7. SKILL BAR ANIMATION
   Animates .skill-item__fill width from 0 to data-level value
   when the skills section scrolls into view.
============================================================ */
const SkillBarAnimator = (() => {
  function animateBars(container) {
    $$('.skill-item__fill', container).forEach(fill => {
      const level = fill.getAttribute('data-level');
      if (level) {
        // Small delay ensures transition is applied after width is set to 0
        requestAnimationFrame(() => {
          fill.style.width = level + '%';
        });
      }
    });
  }

  function init() {
    if (prefersReducedMotion()) {
      // Set widths immediately
      $$('.skill-item__fill').forEach(fill => {
        const level = fill.getAttribute('data-level');
        if (level) fill.style.width = level + '%';
      });
      return;
    }

    const skillsSection = $('#skills');
    if (!skillsSection) return;

    let animated = false;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            animateBars(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(skillsSection);
  }

  return { init };
})();


/* ============================================================
   8. COUNTER ANIMATION (About Section Stats)
   Animates [data-count] elements from 0 up to their target value.
============================================================ */
const CounterAnimator = (() => {
  /**
   * Easing function — ease out quad.
   * @param {number} t — progress 0..1
   * @returns {number}
   */
  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1500; // ms
    const start    = performance.now();

    function frame(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuad(progress);
      const current  = Math.round(eased * target);

      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target; // ensure exact final value
      }
    }

    requestAnimationFrame(frame);
  }

  function init() {
    const counterEls = $$('[data-count]');
    if (!counterEls.length) return;

    if (prefersReducedMotion()) {
      counterEls.forEach(el => {
        el.textContent = el.getAttribute('data-count');
      });
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counterEls.forEach(el => observer.observe(el));
  }

  return { init };
})();


/* ============================================================
   9. COMMENT SECTION & FORM
   - Replaces send-message form with interactive comment system.
   - Requires only: Name ("Nama") and Comment ("Komentar").
   - Saves comments to localStorage with real-time rendering.
   - Includes validation, anti-XSS sanitization, and timestamps.
============================================================ */
const CommentManager = (() => {
  const STORAGE_KEY = 'dhion_portfolio_comments';

  // Default starter comments if none exist in localStorage
  const DEFAULT_COMMENTS = [
    {
      id: 'default-1',
      name: 'Muh. Dhion. R',
      isOwner: true,
      text: 'Halo! Selamat datang di website portofolio saya. Silakan tinggalkan komentar, saran, atau sekadar menyapa di sini. Terima kasih sudah berkunjung!',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString()
    },
    {
      id: 'default-2',
      name: 'Rian Pratama',
      isOwner: false,
      text: 'Portofolionya sangat rapi dan keren! Desainnya modern dan nyaman dilihat. Sukses selalu untuk perkuliahan di Sistem Informasi dan proyek ke depannya!',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString()
    }
  ];

  /* ---- Escape HTML to prevent XSS ---- */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---- Format date / relative time ---- */
  function formatCommentDate(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari yang lalu`;

      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Baru saja';
    }
  }

  /* ---- Storage helpers ---- */
  function getComments() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COMMENTS));
        return DEFAULT_COMMENTS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_COMMENTS;
    } catch (e) {
      console.warn('Storage access failed, using default comments:', e);
      return DEFAULT_COMMENTS;
    }
  }

  function saveComments(comments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch (e) {
      console.warn('Failed to save comments to localStorage:', e);
    }
  }

  /* ---- Validation rules ---- */
  function validateName(value) {
    const trimmed = value.trim();
    if (!trimmed) return 'Nama tidak boleh kosong.';
    if (trimmed.length < 2) return 'Nama minimal 2 karakter.';
    if (trimmed.length > 50) return 'Nama terlalu panjang (maks 50 karakter).';
    return '';
  }

  function validateComment(value) {
    const trimmed = value.trim();
    if (!trimmed) return 'Komentar tidak boleh kosong.';
    if (trimmed.length < 3) return 'Komentar minimal 3 karakter.';
    if (trimmed.length > 1000) return 'Komentar terlalu panjang (maks 1000 karakter).';
    return '';
  }

  /* ---- UI helpers ---- */
  function setFieldError(input, errorEl, message) {
    if (message) {
      input.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = message;
    } else {
      input.classList.remove('is-error');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.textContent = '';
    }
  }

  function showFeedback(feedbackEl, type, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'form-feedback';
    feedbackEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
    feedbackEl.textContent = message;
    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setSubmitLoading(btn, isLoading) {
    if (!btn) return;
    const textEl = btn.querySelector('.btn__text');
    if (isLoading) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (textEl) textEl.textContent = 'Mengirim...';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (textEl) textEl.textContent = 'Kirim Komentar';
    }
  }

  /* ---- Render comments list ---- */
  function renderComments(commentsListEl, countEl) {
    if (!commentsListEl) return;
    const comments = getComments();

    if (countEl) {
      countEl.textContent = comments.length;
    }

    if (!comments.length) {
      commentsListEl.innerHTML = `
        <div class="comments-empty">
          <p>Belum ada komentar. Jadilah yang pertama berkomentar!</p>
        </div>
      `;
      return;
    }

    commentsListEl.innerHTML = comments.map(item => {
      const initial = (item.name || 'A').trim().charAt(0).toUpperCase();
      const safeName = escapeHTML(item.name || 'Pengunjung');
      const safeText = escapeHTML(item.text || '');
      const timeStr = formatCommentDate(item.date);
      const badge = item.isOwner
        ? `<span class="comment-badge">Pemilik</span>`
        : '';

      return `
        <article class="comment-item" tabindex="0">
          <div class="comment-avatar" aria-hidden="true">${initial}</div>
          <div class="comment-content">
            <div class="comment-meta">
              <div class="comment-author-wrapper">
                <strong class="comment-author">${safeName}</strong>
                ${badge}
              </div>
              <time class="comment-date" datetime="${item.date}">${timeStr}</time>
            </div>
            <p class="comment-text">${safeText}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  /* ---- Live validation ---- */
  function attachLiveValidation(form) {
    const nameInput    = $('#commentName',    form) || $('#contactName', form);
    const commentInput = $('#commentMessage', form) || $('#contactMessage', form);
    const nameError    = $('#nameError',      form);
    const commentError = $('#commentError',   form) || $('#messageError', form);

    if (nameInput && nameError) {
      nameInput.addEventListener('blur', () => {
        setFieldError(nameInput, nameError, validateName(nameInput.value));
      });
      nameInput.addEventListener('input', () => {
        if (nameInput.classList.contains('is-error')) {
          setFieldError(nameInput, nameError, validateName(nameInput.value));
        }
      });
    }

    if (commentInput && commentError) {
      commentInput.addEventListener('blur', () => {
        setFieldError(commentInput, commentError, validateComment(commentInput.value));
      });
      commentInput.addEventListener('input', () => {
        if (commentInput.classList.contains('is-error')) {
          setFieldError(commentInput, commentError, validateComment(commentInput.value));
        }
      });
    }
  }

  function init() {
    const form = $('#commentForm') || $('#contactForm');
    const commentsListEl = $('#commentsList');
    const commentsCountEl = $('#commentsCount');

    // Render comments from storage on page load
    renderComments(commentsListEl, commentsCountEl);

    if (!form) return;

    attachLiveValidation(form);

    form.addEventListener('submit', e => {
      e.preventDefault();

      const nameInput    = $('#commentName',    form) || $('#contactName', form);
      const commentInput = $('#commentMessage', form) || $('#contactMessage', form);
      const nameError    = $('#nameError',      form);
      const commentError = $('#commentError',   form) || $('#messageError', form);
      const feedbackEl   = $('#formFeedback',   form);
      const submitBtn    = $('#submitBtn',      form);

      if (!nameInput || !commentInput) return;

      const nameErr    = validateName(nameInput.value);
      const commentErr = validateComment(commentInput.value);

      setFieldError(nameInput,    nameError,    nameErr);
      setFieldError(commentInput, commentError, commentErr);

      if (nameErr || commentErr) {
        if (nameErr) nameInput.focus();
        else commentInput.focus();
        return;
      }

      // Valid: brief feedback state
      setSubmitLoading(submitBtn, true);

      setTimeout(() => {
        const newComment = {
          id: 'comment-' + Date.now(),
          name: nameInput.value.trim(),
          isOwner: false,
          text: commentInput.value.trim(),
          date: new Date().toISOString()
        };

        const currentComments = getComments();
        currentComments.unshift(newComment);
        saveComments(currentComments);

        // Update UI
        renderComments(commentsListEl, commentsCountEl);
        setSubmitLoading(submitBtn, false);

        showFeedback(
          feedbackEl,
          'success',
          '✓ Komentar Anda berhasil dikirim! Terima kasih atas komentarnya.'
        );

        // Reset form inputs & errors
        form.reset();
        [nameInput, commentInput].forEach(inp => {
          inp.classList.remove('is-error');
          inp.removeAttribute('aria-invalid');
        });
        [nameError, commentError].forEach(el => {
          if (el) el.textContent = '';
        });

        // Automatically hide feedback banner after 6 seconds
        setTimeout(() => {
          if (feedbackEl) {
            feedbackEl.className = 'form-feedback';
            feedbackEl.textContent = '';
          }
        }, 6000);
      }, 350);
    });
  }

  return { init };
})();

// Backward compatibility alias
const ContactFormManager = CommentManager;


/* ============================================================
   10. COPYRIGHT YEAR (auto)
============================================================ */
function setCopyrightYear() {
  const el = $('#copyrightYear');
  if (el) el.textContent = new Date().getFullYear();
}


/* ============================================================
   11. BACK-TO-TOP BUTTON
============================================================ */
const BackToTopManager = (() => {
  const SHOW_THRESHOLD = 400; // px from top

  function init() {
    const btn = $('#backToTop');
    if (!btn) return;

    function updateVisibility() {
      if (window.scrollY > SHOW_THRESHOLD) {
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    }

    updateVisibility();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisibility();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return { init };
})();


/* ============================================================
   BONUS: Project card & button micro-interactions
   Adds a subtle "ripple" press effect to .btn elements.
============================================================ */
const MicroInteractions = (() => {
  function addRipple(e) {
    const btn = e.currentTarget;
    const existing = btn.querySelector('.btn-ripple');
    if (existing) existing.remove();

    const circle = document.createElement('span');
    circle.className = 'btn-ripple';

    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 1.6;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    Object.assign(circle.style, {
      width:     `${size}px`,
      height:    `${size}px`,
      left:      `${x}px`,
      top:       `${y}px`,
      position:  'absolute',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.18)',
      transform: 'scale(0)',
      pointerEvents: 'none',
      animation: 'ripple 0.5s ease-out forwards',
    });

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }

  function init() {
    if (prefersReducedMotion()) return;

    // Inject ripple keyframe dynamically (avoids adding it to CSS)
    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes ripple {
          to { transform: scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    $$('.btn').forEach(btn => {
      // Ensure btn has position:relative (may already be set in CSS)
      if (getComputedStyle(btn).position === 'static') {
        btn.style.position = 'relative';
      }
      btn.addEventListener('click', addRipple);
    });
  }

  return { init };
})();


/* ============================================================
   INITIALISATION
   All modules are initialised after the DOM is ready.
============================================================ */
function init() {
  ThemeManager.init();
  NavbarManager.init();
  MobileMenuManager.init();
  SmoothScrollManager.init();
  ScrollRevealManager.init();
  TypingAnimation.init();
  SkillBarAnimator.init();
  CounterAnimator.init();
  CommentManager.init();
  setCopyrightYear();
  BackToTopManager.init();
  MicroInteractions.init();
}

// Run after DOM is fully parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready (script loaded with defer or at bottom of body)
  init();
}

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
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
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
    'Information Systems Student',
    'Web Developer',
    'Tech Enthusiast',
    'Problem Solver',
    'System Analyst',
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
   9. CONTACT FORM
   - Validates all fields before submission.
   - Uses mailto: as the action (no backend required).
   - Shows inline error messages and a success/error banner.
   - For production: swap the form action to Formspree or EmailJS.
============================================================ */
const ContactFormManager = (() => {
  /* ---- Validation rules ---- */

  function validateName(value) {
    if (!value.trim()) return 'Nama tidak boleh kosong.';
    if (value.trim().length < 2) return 'Nama minimal 2 karakter.';
    if (value.trim().length > 100) return 'Nama terlalu panjang.';
    return '';
  }

  function validateEmail(value) {
    if (!value.trim()) return 'Email tidak boleh kosong.';
    // RFC 5322-inspired simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return 'Format email tidak valid.';
    return '';
  }

  function validateMessage(value) {
    if (!value.trim()) return 'Pesan tidak boleh kosong.';
    if (value.trim().length < 10) return 'Pesan minimal 10 karakter.';
    if (value.trim().length > 2000) return 'Pesan terlalu panjang (maks 2000 karakter).';
    return '';
  }

  /* ---- UI helpers ---- */

  function setFieldError(input, errorEl, message) {
    if (message) {
      input.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      input.classList.remove('is-error');
      input.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  function showFeedback(feedbackEl, type, message) {
    feedbackEl.className = 'form-feedback'; // reset classes
    feedbackEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
    feedbackEl.textContent = message;
    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setSubmitLoading(btn, isLoading) {
    const textEl = btn.querySelector('.btn__text');
    if (isLoading) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (textEl) textEl.textContent = 'Mengirim...';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (textEl) textEl.textContent = 'Kirim Pesan';
    }
  }

  /* ---- Live validation (on blur) ---- */

  function attachLiveValidation(form) {
    const nameInput    = $('#contactName',    form);
    const emailInput   = $('#contactEmail',   form);
    const messageInput = $('#contactMessage', form);
    const nameError    = $('#nameError',      form);
    const emailError   = $('#emailError',     form);
    const messageError = $('#messageError',   form);

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

    if (emailInput && emailError) {
      emailInput.addEventListener('blur', () => {
        setFieldError(emailInput, emailError, validateEmail(emailInput.value));
      });
      emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('is-error')) {
          setFieldError(emailInput, emailError, validateEmail(emailInput.value));
        }
      });
    }

    if (messageInput && messageError) {
      messageInput.addEventListener('blur', () => {
        setFieldError(messageInput, messageError, validateMessage(messageInput.value));
      });
      messageInput.addEventListener('input', () => {
        if (messageInput.classList.contains('is-error')) {
          setFieldError(messageInput, messageError, validateMessage(messageInput.value));
        }
      });
    }
  }

  function init() {
    const form = $('#contactForm');
    if (!form) return;

    attachLiveValidation(form);

    form.addEventListener('submit', e => {
      // Always prevent default first so we can validate
      e.preventDefault();

      const nameInput    = $('#contactName',    form);
      const emailInput   = $('#contactEmail',   form);
      const messageInput = $('#contactMessage', form);
      const nameError    = $('#nameError',      form);
      const emailError   = $('#emailError',     form);
      const messageError = $('#messageError',   form);
      const feedbackEl   = $('#formFeedback',   form);
      const submitBtn    = $('#submitBtn',      form);

      if (!nameInput || !emailInput || !messageInput) return;

      // Run all validations
      const nameErr    = validateName(nameInput.value);
      const emailErr   = validateEmail(emailInput.value);
      const messageErr = validateMessage(messageInput.value);

      setFieldError(nameInput,    nameError,    nameErr);
      setFieldError(emailInput,   emailError,   emailErr);
      setFieldError(messageInput, messageError, messageErr);

      const hasError = nameErr || emailErr || messageErr;

      if (hasError) {
        // Focus first field with error
        if (nameErr)    nameInput.focus();
        else if (emailErr) emailInput.focus();
        else            messageInput.focus();
        return;
      }

      // --- Validation passed ---
      setSubmitLoading(submitBtn, true);

      /**
       * mailto: fallback — opens the user's default email client.
       * For a real form submission without a backend, replace this
       * with Formspree: change <form action="https://formspree.io/f/YOUR_ID">
       * and remove the e.preventDefault() call above. Formspree will
       * handle everything and show a success page.
       */
      const mailtoAction = form.getAttribute('action');
      const isMailto = mailtoAction && mailtoAction.startsWith('mailto:');

      if (isMailto) {
        // Build the mailto link with the form data
        const subject = encodeURIComponent(`Pesan dari ${nameInput.value.trim()}`);
        const body    = encodeURIComponent(
          `Nama: ${nameInput.value.trim()}\n` +
          `Email: ${emailInput.value.trim()}\n\n` +
          `Pesan:\n${messageInput.value.trim()}`
        );
        const mailto = `${mailtoAction}?subject=${subject}&body=${body}`;

        // Small delay for UX
        setTimeout(() => {
          setSubmitLoading(submitBtn, false);
          window.location.href = mailto;

          showFeedback(
            feedbackEl,
            'success',
            '✓ Email client Anda akan terbuka. Silakan kirim pesan dari sana. Terima kasih!'
          );

          // Reset form
          form.reset();
          // Clear any remaining error states
          [nameInput, emailInput, messageInput].forEach(inp => {
            inp.classList.remove('is-error');
            inp.removeAttribute('aria-invalid');
          });
          [nameError, emailError, messageError].forEach(el => {
            if (el) el.textContent = '';
          });
        }, 600);

      } else {
        /**
         * If using Formspree or another service with fetch API:
         *
         * fetch(form.action, {
         *   method: 'POST',
         *   body: new FormData(form),
         *   headers: { 'Accept': 'application/json' }
         * })
         * .then(res => res.ok ? res.json() : Promise.reject(res))
         * .then(() => {
         *   showFeedback(feedbackEl, 'success', 'Pesan berhasil dikirim!');
         *   form.reset();
         * })
         * .catch(() => {
         *   showFeedback(feedbackEl, 'error', 'Gagal mengirim. Coba lagi.');
         * })
         * .finally(() => setSubmitLoading(submitBtn, false));
         */

        // Fallback: submit the form normally
        setSubmitLoading(submitBtn, false);
        form.submit();
      }
    });
  }

  return { init };
})();


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
  ContactFormManager.init();
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

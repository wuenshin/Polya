/**
 * POLINA — Private Editorial Monograph
 * Main JavaScript Controller
 * Lightbox modal, touch gestures, keyboard accessibility, scroll reveals, 5 distinct photo sessions in archive.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  initMobileNavigation();
  initGalleryAndLightbox();
  initSmoothScroll();
});

/* ==========================================================================
   1. Scroll Reveal Animations (IntersectionObserver)
   ========================================================================== */
function initScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    reveals.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  reveals.forEach(el => observer.observe(el));
}

/* ==========================================================================
   2. Mobile Navigation Toggle
   ========================================================================== */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  const setNavState = (shouldOpen) => {
    const isCurrentlyOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = typeof shouldOpen === 'boolean' ? shouldOpen : !isCurrentlyOpen;
    toggleBtn.setAttribute('aria-expanded', String(nextState));
    navMenu.classList.toggle('active', nextState);
    document.body.style.overflow = nextState ? 'hidden' : '';
  };

  toggleBtn.addEventListener('click', () => setNavState());

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        setNavState(false);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
      setNavState(false);
      toggleBtn.focus();
    }
  });
}

/* ==========================================================================
   3. Gallery Grid & Fullscreen Lightbox (5 Organized Photo Sessions)
   ========================================================================== */
function initGalleryAndLightbox() {
  const galleryGrid = document.getElementById('gallery-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lightbox = document.getElementById('lightbox-modal');

  if (!galleryGrid || !lightbox || !window.GALLERY_DATA) return;

  const images = window.GALLERY_DATA;
  let currentFilteredList = [...images];
  let currentIndex = 0;
  let lastFocusedElement = null;

  // Elements inside lightbox
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');

  // The 5 strict photo sessions in order
  const SESSIONS = [
    { key: 'glasses', num: 'Серия I', title: 'Бокалы и свет', count: 5 },
    { key: 'candle', num: 'Серия II', title: 'Съёмка со свечой', count: 5 },
    { key: 'stairwell', num: 'Серия III', title: 'Ночь в подъезде', count: 20 },
    { key: 'beams', num: 'Серия IV', title: 'Игра с пучками света', count: 5 },
    { key: 'red', num: 'Серия V', title: 'Красная серия', count: 7 }
  ];

  // Render gallery cards organized into 5 distinct sessions
  function renderGallery(filter = 'all') {
    galleryGrid.innerHTML = '';

    const activeSessions = filter === 'all'
      ? SESSIONS
      : SESSIONS.filter(s => s.key === filter);

    currentFilteredList = [];

    activeSessions.forEach((session, sessionIdx) => {
      const sessionPhotos = images.filter(item => item.category === session.key);
      if (!sessionPhotos.length) return;

      const groupEl = document.createElement('section');
      groupEl.className = 'gallery-session-group';
      groupEl.dataset.session = session.key;

      groupEl.innerHTML = `
        <header class="gallery-session-header reveal">
          <div class="gallery-session-meta">
            <span class="gallery-session-tag">${session.num}</span>
            <span class="gallery-session-count">${sessionPhotos.length} кадров</span>
          </div>
          <h3 class="gallery-session-title">${session.title}</h3>
        </header>
        <div class="gallery-session-grid"></div>
      `;

      const gridEl = groupEl.querySelector('.gallery-session-grid');

      sessionPhotos.forEach(photo => {
        const globalIdx = currentFilteredList.length;
        currentFilteredList.push(photo);

        const card = document.createElement('div');
        card.className = `gallery-item ${photo.is_vertical ? 'portrait' : 'landscape'} reveal`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Открыть фотографию: ${photo.title} — ${photo.subtitle}`);
        card.dataset.index = globalIdx;

        card.innerHTML = `
          <div class="gallery-thumb-wrap">
            <img 
              src="${photo.thumb}" 
              alt="${photo.alt}" 
              loading="lazy" 
              width="${photo.is_vertical ? 500 : 750}" 
              height="${photo.is_vertical ? 750 : 500}"
              onload="this.classList.add('loaded')"
            >
            <div class="gallery-item-overlay">
              <div class="gallery-item-info">
                <span>${photo.title}</span>
                <span class="gallery-item-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                  Просмотр
                </span>
              </div>
            </div>
          </div>
        `;

        const openHandler = () => {
          openLightbox(globalIdx, card);
        };

        card.addEventListener('click', openHandler);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openHandler();
          }
        });

        gridEl.appendChild(card);
      });

      galleryGrid.appendChild(groupEl);

      // Add a subtle divider between sessions if displaying all and not the last one
      if (filter === 'all' && sessionIdx < activeSessions.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'gallery-session-divider reveal';
        galleryGrid.appendChild(divider);
      }
    });

    initScrollReveals();
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter || 'all';
      renderGallery(filter);
    });
  });

  // Open Lightbox
  function openLightbox(index, triggerElement) {
    if (index < 0 || index >= currentFilteredList.length) return;
    currentIndex = index;
    lastFocusedElement = triggerElement;

    updateLightboxView();

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    closeBtn.focus();
  }

  // Close Lightbox
  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  // Show Next / Prev
  function showNext() {
    if (currentIndex < currentFilteredList.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0;
    }
    updateLightboxView();
  }

  function showPrev() {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = currentFilteredList.length - 1;
    }
    updateLightboxView();
  }

  // Update image & text
  function updateLightboxView() {
    const item = currentFilteredList[currentIndex];
    if (!item) return;

    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.98)';

    const tempImg = new Image();
    tempImg.src = item.large;
    tempImg.onload = () => {
      lightboxImg.src = item.large;
      lightboxImg.alt = item.alt;
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    };

    lightboxCounter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(currentFilteredList.length).padStart(2, '0')}`;
    lightboxCaption.textContent = item.subtitle ? `${item.title}: «${item.subtitle}»` : `${item.title} — ${item.tag}`;

    // Preload next image for instant transition
    const nextIdx = (currentIndex + 1) % currentFilteredList.length;
    if (currentFilteredList[nextIdx]) {
      const preloadNext = new Image();
      preloadNext.src = currentFilteredList[nextIdx].large;
    }
  }

  // Lightbox Click Listeners
  closeBtn.addEventListener('click', closeLightbox);
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);

  // Click on background overlay closes lightbox
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-stage') || e.target.classList.contains('lightbox-image-wrap')) {
      closeLightbox();
    }
  });

  // Keyboard navigation inside lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrev();
    } else if (e.key === 'Tab') {
      const focusable = [closeBtn, prevBtn, nextBtn].filter(el => el && !el.disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Touch swipe support for smartphones
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        showNext();
      } else {
        showPrev();
      }
    }
  }

  // Initial render with all photos
  renderGallery('all');
}

/* ==========================================================================
   4. Smooth Scroll for Anchor Links & Back to Top
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  const backToTopBtn = document.querySelector('.footer-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

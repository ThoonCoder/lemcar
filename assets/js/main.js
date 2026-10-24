/* =============================================================
   LEMCAR SERVIÇOS AUTOMOTIVOS — main.js
   JavaScript puro, sem dependências.
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');
  var toTop = document.querySelector('.to-top');

  /* ---------- 1. Header com desfoque ao rolar + "voltar ao topo" ---------- */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Menu hambúrguer em tela cheia ---------- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  var hasIO = 'IntersectionObserver' in window;

  /* ---------- 3. Link ativo no menu ---------- */
  var links = document.querySelectorAll('.nav__list a');
  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var section = document.querySelector(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ---------- 4. Revelação suave ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) {
      // atraso em cascata entre irmãos (cards, passos, fotos)
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('reveal');
      });
      var i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 90 + 'ms';
      revealer.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 5. Contadores animados ---------- */
  var counters = document.querySelectorAll('[data-count]');

  function format(value, decimals) {
    return value.toFixed(decimals).replace('.', ',');
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, decimals);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (hasIO && !reduceMotion) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterIO.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterIO.observe(el); });
  }

  /* ---------- 6. Galeria com lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lbImg = lightbox.querySelector('.lightbox__img');
  var lbCaption = lightbox.querySelector('.lightbox__caption');
  var current = 0;

  function show(i) {
    current = (i + items.length) % items.length;
    var thumb = items[current].querySelector('img');
    lbImg.src = items[current].getAttribute('data-full');
    lbImg.alt = thumb.alt;
    lbCaption.textContent = thumb.alt + ' — ' + (current + 1) + '/' + items.length;
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () {
      show(i);
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      else window.open(item.getAttribute('data-full'), '_blank');
    });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', function () { lightbox.close(); });
  lightbox.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  lightbox.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  lightbox.addEventListener('close', function () { if (items[current]) items[current].focus(); });

  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- 7. Destaca o dia de hoje na tabela de horário ---------- */
  var today = String(new Date().getDay());
  document.querySelectorAll('.hours tr[data-days]').forEach(function (tr) {
    if (tr.getAttribute('data-days').split(',').indexOf(today) !== -1) tr.classList.add('is-today');
  });

  /* ---------- 8. Ano automático no rodapé ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();

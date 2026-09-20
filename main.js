/* =============================================================================
   Lingua — landing
   Không framework, không phụ thuộc. Mọi hiệu ứng đều **hữu hạn** và tự tắt khi
   người dùng bật giảm chuyển động — cùng luật với phần Flutter của app, để một
   người nhạy cảm với chuyển động không gặp hai hành vi khác nhau giữa trang
   giới thiệu và app.
   ============================================================================= */
(function () {
  'use strict';

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── nav: cờ "đã rời đỉnh trang" ────────────────────────────────────────
     Một sentinel 1px ở đầu trang thay cho listener scroll: trình duyệt chỉ báo
     khi nó thực sự ra/vào khung nhìn, nên không có hàm nào chạy mỗi frame cuộn. */
  function initStickyNav() {
    var nav = $('#nav');
    if (!nav) return;
    var probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
    document.body.prepend(probe);
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(probe);
  }

  /* ── menu trên màn hẹp ─────────────────────────────────────────────────── */
  function initMenu() {
    var burger = $('#nav-burger');
    var links = $('#nav-links');
    if (!burger || !links) return;

    function setOpen(on) {
      links.classList.toggle('is-open', on);
      burger.setAttribute('aria-expanded', String(on));
      burger.setAttribute('aria-label', on ? 'Đóng mục lục' : 'Mở mục lục');
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    // Chọn một mục rồi thì menu phải tự đóng, nếu không nó che mất đúng chỗ
    // vừa nhảy tới.
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ── reveal khi cuộn tới ────────────────────────────────────────────────
     Đặt style bằng JS chứ không bằng class, rồi **gỡ sạch sau khi xong**: để
     lại will-change trên vài chục phần tử là ép trình duyệt giữ từng ấy lớp
     hợp thành cho tới khi rời trang. */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;

    if (REDUCE) return; // không giấu gì cả, nội dung hiện sẵn

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.willChange = 'opacity, transform';
    });

    function show(el, delay) {
      setTimeout(function () {
        el.style.transition =
          'opacity 520ms cubic-bezier(.22,.61,.36,1), transform 520ms cubic-bezier(.22,.61,.36,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        setTimeout(function () {
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          el.style.willChange = '';
        }, 700);
      }, delay);
    }

    var io = new IntersectionObserver(function (entries) {
      // So le theo lô hiện ra cùng lúc, không theo chỉ số toàn trang — nếu
      // theo chỉ số thì phần tử thứ 30 phải chờ gần một giây sau khi đã nằm
      // sẵn trước mắt người đọc.
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        show(e.target, Math.min(i, 6) * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── scrollspy cho nav ──────────────────────────────────────────────────── */
  function initScrollSpy() {
    var links = $$('#nav-links a[href^="#"]');
    if (!links.length) return;

    var map = {};
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      map[id] = a;
      sections.push(el);
    });
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[e.target.id];
        if (a) a.classList.add('is-active');
      });
    }, { threshold: 0.35 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ── tab tính năng ──────────────────────────────────────────────────────── */
  function initTabs() {
    var tabs = $$('.tab');
    var panels = $$('.panel');
    if (!tabs.length) return;

    function activate(key) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.panel === key);
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.tab); });
    });

    // Mũi tên trái/phải giữa các tab là hành vi bàn phím mặc định của
    // role="tablist"; không tự làm thì người dùng bàn phím bị kẹt.
    $('.tabs__bar') && $('.tabs__bar').addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (next < 0 || next >= tabs.length) return;
      e.preventDefault();
      tabs[next].focus();
      activate(tabs[next].dataset.tab);
    });
  }

  /* ── sóng chấm ở hero ───────────────────────────────────────────────────
     Một gợn sóng lan từ góc trên trái, chạy **đúng một lượt** rồi xoá canvas và
     huỷ vòng lặp. Cố ý không lặp: nền động vô hạn phía sau chữ vừa tốn pin vừa
     kéo mắt khỏi chính câu tiêu đề mà nó đang trang trí. */
  function initWave() {
    var canvas = $('#hero-wave');
    if (!canvas || REDUCE) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, raf = null, t0 = 0;

    var SIZE = 4.2;    // đường kính chấm lớn nhất, px
    var GAP = 22;      // khoảng cách lưới, px
    var SPEED = 2.2;   // radian/giây
    var K = 1.7;       // độ trễ theo khoảng cách → sóng lan ra ngoài
    var MAXD = 2.6;    // khoảng cách chuẩn hoá xa nhất (góc đối diện)
    var DUR = (MAXD * K + Math.PI * 2) / SPEED;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / 1000;
      if (t > DUR) { ctx.clearRect(0, 0, w, h); raf = null; return; }

      var fade = t > DUR - 0.8 ? Math.max(0, (DUR - t) / 0.8) : 1;
      ctx.clearRect(0, 0, w, h);

      var norm = Math.max(w, h) || 1;
      for (var y = 0; y < h; y += GAP) {
        for (var x = 0; x < w; x += GAP) {
          var d = Math.sqrt(x * x + y * y) / norm;
          var phase = t * SPEED - d * K;
          if (phase <= 0 || phase >= Math.PI * 2) continue;
          var amp = (1 - Math.cos(phase)) / 2;       // 0 → 1 → 0
          var r = (SIZE / 2) * amp;
          if (r < 0.25) continue;
          ctx.globalAlpha = amp * 0.5 * fade;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    resize();
    ctx.fillStyle = '#6c5ce7';
    // Đổi kích thước giữa chừng thì bỏ luôn hiệu ứng: vẽ lại một gợn sóng đã
    // chạy dở ở kích thước mới trông như lỗi hơn là như hiệu ứng.
    window.addEventListener('resize', function () {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      resize();
      ctx.fillStyle = '#6c5ce7';
      ctx.clearRect(0, 0, w, h);
    });

    raf = requestAnimationFrame(frame);
  }

  /* ── PWA đã cài từ trước ────────────────────────────────────────────────
     App từng nằm ở gốc site, nên manifest của những bản đã cài có start_url
     trỏ vào đây. Giờ gốc là trang giới thiệu — mở app từ màn hình chính mà ra
     trang quảng cáo thì trông như app đã hỏng. Chỉ chuyển hướng khi thực sự
     chạy ở chế độ ứng dụng độc lập; mở bằng tab trình duyệt thì vẫn thấy
     landing như bình thường. `replace` để nút quay lại không bật ngược ra đây. */
  function redirectInstalledApp() {
    var standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (!standalone) return false;
    location.replace('app/');
    return true;
  }

  /* ── khởi động ──────────────────────────────────────────────────────────── */
  function boot() {
    if (redirectInstalledApp()) return;
    initStickyNav();
    initMenu();
    initReveal();
    initScrollSpy();
    initTabs();
    initWave();
    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// 葛孟雨个人网站 - 共享交互脚本
// 现阶段做：滚动时高亮导航 + 滚动揭示动画

(() => {
  // ========== 滚动高亮导航 ==========
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  const setActiveLink = () => {
    const scrollPos = window.scrollY + 120;
    let current = '';

    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) {
        current = section.id;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isActive = href === `#${current}`;
      link.classList.toggle('active', isActive);
    });
  };

  // ========== 滚动揭示动画 ==========
  const revealEls = document.querySelectorAll(
    '.card, .section-header, .hero-portrait, .hero-text'
  );
  revealEls.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));

  // 首屏元素立即显示（不靠 IntersectionObserver）
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero-portrait, .hero-text').forEach((el) => {
      el.classList.add('in');
    });
  });

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();
})();
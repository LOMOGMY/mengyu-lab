// 葛孟雨个人网站 - 交互脚本
// 现阶段只做简单的滚动高亮导航，未来会扩展。

(() => {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  // 滚动时高亮当前区段对应的导航项
  const setActiveLink = () => {
    const scrollPos = window.scrollY + 100;
    let current = '';

    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) {
        current = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.style.color = isActive ? 'var(--c-primary)' : '';
    });
  };

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();
})();
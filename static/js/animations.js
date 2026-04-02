const animatedElements = document.querySelectorAll('.problem-card, .state-card, .step-card, .demo-panel, .feat-card, .compare-table-wrap, .security-card, .price-card, .faq-item, .problem-stat');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

animatedElements.forEach((element, index) => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(24px)';
  element.style.transition = `opacity .7s cubic-bezier(.16,1,.3,1) ${index * 0.05}s, transform .7s cubic-bezier(.16,1,.3,1) ${index * 0.05}s`;
  observer.observe(element);
});

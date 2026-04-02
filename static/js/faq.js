const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const button = item.querySelector('.faq-question');
  if (!button) return;

  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    faqItems.forEach(entry => {
      entry.classList.remove('is-open');
      const trigger = entry.querySelector('.faq-question');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

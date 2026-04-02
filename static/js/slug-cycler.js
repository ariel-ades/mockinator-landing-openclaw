const slugs = ['acme-corp', 'your-project', 'payments-api', 'auth-service', 'fintech-app'];
let slugIndex = 0;
const slugElement = document.getElementById('slug');

function cycleSlug() {
  if (!slugElement) return;
  slugElement.style.transition = 'opacity .3s';
  slugElement.style.opacity = '0';

  setTimeout(() => {
    slugIndex = (slugIndex + 1) % slugs.length;
    slugElement.textContent = slugs[slugIndex];
    slugElement.style.opacity = '1';
  }, 300);
}

if (slugElement) {
  setInterval(cycleSlug, 2800);
}

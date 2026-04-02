const modalOverlay = document.getElementById('subscribe-modal-overlay');
const modalTitle = document.getElementById('subscribe-modal-title');
const modalCopy = document.getElementById('subscribe-modal-copy');
const modalForm = document.getElementById('subscribe-modal-form');
const modalActions = document.getElementById('subscribe-modal-actions');
const modalDoneButton = document.getElementById('subscribe-modal-done');
const modalCloseButton = document.getElementById('subscribe-modal-close');
const fullNameInput = document.getElementById('subscribe-full-name');
const emailInput = document.getElementById('subscribe-email');
const submitButton = modalForm ? modalForm.querySelector('button[type="submit"]') : null;
const defaultSubmitButtonText = submitButton ? submitButton.textContent : 'Join now';

const modalContent = {
  form: {
    title: 'Join our waitlist',
    description: [
      "We're hard at work building Mockinator, your go-to platform for contract-first development, instant mocking, and seamless frontend/backend collaboration.",
      "While we're not live just yet, you can join the waitlist today. As soon as we launch, your account will be created automatically and you'll be among the first to get access.",
      "Thanks for your patience, we can't wait to show you what we're building!"
    ]
  },
  success: {
    title: "You're on the list",
    description: [
      "Thanks for joining the Mockinator waitlist! We're excited to have you onboard and can't wait to show you what we're building.",
      "Mockinator is still in development, but we're moving fast. Once we go live, your account will be created automatically and you'll be among the first to get access - no extra steps needed.",
      "In the meantime, keep an eye on your inbox for updates, sneak peeks, and early access invites. Welcome to the future of contract-first mocking!"
    ]
  },
  alreadyOnWaitlist: {
    title: "You're already on the waitlist",
    description: [
      "Good news - you're already signed up! Your spot is secured, and you'll be among the first to access Mockinator when we launch.",
      "We're still putting the finishing touches on the platform, and once we go live, your account will be created automatically - no need to do anything else.",
      "Stay tuned for updates! We'll be sharing progress, sneak peeks, and launch details straight to your inbox. Thanks for being part of this early journey."
    ]
  }
};

const MODAL_ANIM_DURATION = 280;

function setModalStep(step) {
  const content = modalContent[step];
  if (!content) return;

  if (modalTitle) modalTitle.textContent = content.title;
  if (modalCopy) modalCopy.innerHTML = content.description.map(text => `<p>${text}</p>`).join('');

  const showingForm = step === 'form';

  if (modalForm) {
    modalForm.hidden = !showingForm;
    modalForm.style.display = showingForm ? 'flex' : 'none';
  }

  if (modalActions) {
    modalActions.hidden = showingForm;
    modalActions.style.display = showingForm ? 'none' : 'flex';
  }
}

function openSubscribeModal() {
  if (!modalOverlay) return;
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  setModalStep('form');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalOverlay.classList.add('is-open');
    });
  });
}

function closeSubscribeModal() {
  if (!modalOverlay || !modalForm) return;
  modalOverlay.classList.remove('is-open');
  modalOverlay.classList.add('is-closing');
  setTimeout(() => {
    modalOverlay.hidden = true;
    modalOverlay.classList.remove('is-closing');
    document.body.style.overflow = '';
    modalForm.reset();
    setModalStep('form');
  }, MODAL_ANIM_DURATION);
}

document.querySelectorAll('.js-open-subscribe-modal').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    openSubscribeModal();
  });
});

if (modalCloseButton) modalCloseButton.addEventListener('click', closeSubscribeModal);
if (modalDoneButton) modalDoneButton.addEventListener('click', closeSubscribeModal);

if (modalOverlay) {
  modalOverlay.addEventListener('click', event => {
    if (event.target === modalOverlay) closeSubscribeModal();
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modalOverlay && !modalOverlay.hidden) closeSubscribeModal();
});

if (modalForm && fullNameInput && emailInput && submitButton) {
  modalForm.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.classList.add('is-loading');
    submitButton.disabled = true;
    submitButton.textContent = 'Joining...';
    fullNameInput.disabled = true;
    emailInput.disabled = true;

    try {
      const response = await fetch('https://api-dev.mockinator.io/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullNameInput.value, email: emailInput.value })
      });

      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch (_error) {
        responseBody = null;
      }

      const responseMessage = typeof responseBody?.message === 'string' ? responseBody.message.toLowerCase() : '';

      if (response.status === 409 || responseBody?.state === 'already_exists' || responseMessage.includes('already')) {
        setModalStep('alreadyOnWaitlist');
      } else if (response.ok) {
        setModalStep('success');
      } else {
        console.error('Failed to join waitlist', response.status, responseBody?.message);
      }
    } catch (error) {
      console.error('Failed to join waitlist', error);
    } finally {
      submitButton.classList.remove('is-loading');
      submitButton.disabled = false;
      submitButton.textContent = defaultSubmitButtonText;
      fullNameInput.disabled = false;
      emailInput.disabled = false;
    }
  });
}

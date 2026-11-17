(() => {
  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const first = modal.querySelector('input,select,button');
    if (first) first.focus();
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open-modal]');
    if (opener) openModal(opener.dataset.openModal);
    if (event.target.closest('[data-close-modal]')) closeModal(event.target.closest('.modal-backdrop'));
    if (event.target.classList.contains('modal-backdrop')) closeModal(event.target);
    const edit = event.target.closest('[data-edit-user]');
    if (edit) {
      document.getElementById('edit-user-form').action = `/admin/users/${encodeURIComponent(edit.dataset.id)}/update`;
      document.getElementById('edit-name').value = edit.dataset.name;
      document.getElementById('edit-email').value = edit.dataset.email;
      document.getElementById('edit-role').value = edit.dataset.role;
      document.getElementById('edit-status').value = edit.dataset.status;
      document.querySelector('#edit-user-form [name="password"]').value = '';
      openModal('edit-modal');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop.is-open').forEach(closeModal);
  });
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const password = form.querySelector('[name="password"]');
      const confirmation = form.querySelector('[name="confirmPassword"]');
      if (password && confirmation && password.value !== confirmation.value) {
        event.preventDefault();
        confirmation.setCustomValidity('Passwords do not match.');
        confirmation.reportValidity();
      }
    });
    const confirmation = form.querySelector('[name="confirmPassword"]');
    if (confirmation) confirmation.addEventListener('input', () => confirmation.setCustomValidity(''));
  });
})();

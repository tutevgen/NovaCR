// public/js/admin/product-visibility.js

function initProductVisibility(csrfToken) {
  document.querySelectorAll('.toggle-visibility').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const id = toggle.dataset.id;
      const isVisible = toggle.checked;

      try {
        const res = await fetch(`/admin/products/${id}/toggle-visibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({ isVisible })
        });

        if (!res.ok) {
          alert('Ошибка при изменении статуса');
          toggle.checked = !isVisible; // Откат
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка сети');
        toggle.checked = !isVisible;
      }
    });
  });
}

window.initProductVisibility = initProductVisibility;

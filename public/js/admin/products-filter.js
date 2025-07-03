document.addEventListener('DOMContentLoaded', () => {

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!loadMoreBtn) return;

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  loadMoreBtn.addEventListener('click', async () => {
    const currentPage = parseInt(loadMoreBtn.dataset.currentPage);
    const newPage = currentPage + 1;

    try {
      const res = await fetch(`/admin/products?page=${newPage}`, {
        headers: {
          
          'X-Requested-With': 'XMLHttpRequest',
          'CSRF-Token': csrfToken
        }
      });

      if (!res.ok) throw new Error('Ошибка сервера');

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newRows = doc.querySelectorAll('tbody tr');
      const oldTbody = document.querySelector('table tbody');

      if (oldTbody && newRows.length > 0) {
        newRows.forEach(row => oldTbody.appendChild(row));
      }

      loadMoreBtn.dataset.currentPage = newPage;

      if (newPage >= parseInt(loadMoreBtn.dataset.totalPages)) {
        loadMoreBtn.remove();
      }

      window.bindProductActions?.();
      window.initProductVisibility?.(csrfToken);
      lucide.createIcons();

    } catch (err) {
      console.error('Ошибка при подгрузке:', err);
      alert('Не удалось загрузить следующую страницу');
    }
  });

  // === Инициализация модулей ===
  if (typeof initProductsFilter === 'function') {
    initProductsFilter(csrfToken);
  }

  // === Работа с категориями и характеристиками остаётся без изменений ===
});

function initProductsFilter(csrfToken) {
  const filterForm = document.getElementById('filterForm');
  if (!filterForm) return;

  // Отслеживаем изменения формы (select, input, checkbox)
  filterForm.addEventListener('change', () => {
    triggerFilterUpdate(filterForm);
  });

  // Для поля поиска — отдельно debounce
  const searchInput = filterForm.querySelector('input[name="search"]');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        triggerFilterUpdate(filterForm);
      }, 300);
    });
  }

  // === Обработка чекбоксов характеристик ===
  const charCheckboxes = filterForm.querySelectorAll('input[name="charFilter"]');
  const charFiltersDetails = document.getElementById('charFiltersDetails');

  charCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async function () {
      const key = this.value;
      const containerId = `charValues_${key}`;
      const existingContainer = document.getElementById(containerId);

      // Если чекбокс снят — удаляем блок
      if (!this.checked) {
        if (existingContainer) existingContainer.remove();
        return;
      }

      // Удаляем старый контейнер, если он есть
      if (existingContainer) existingContainer.remove();

      // Загружаем доступные значения с сервера
      try {
        const response = await fetch(`/admin/products/char-values?key=${encodeURIComponent(key)}`);
        if (!response.ok) throw new Error('Ошибка получения значений');
        const values = await response.json();

        if (values.length > 0) {
          renderCharValueOptions(key, values, charFiltersDetails);
        }
      } catch (err) {
        console.error(`Ошибка при получении значений для "${key}":`, err);
      }
    });
  });
}

// === Отрисовка значений характеристик под чекбоксы ===
function renderCharValueOptions(key, values, container) {
  const containerId = `charValues_${key}`;
  let wrapper = document.getElementById(containerId);

  // Удаляем старый блок, если он есть
  if (wrapper) wrapper.remove();

  // Создаём новый контейнер
  wrapper = document.createElement('div');
  wrapper.id = containerId;
  wrapper.className = 'ml-4 mt-2 space-y-2 border-l pl-3 border-gray-200';

  // Заголовок
  const title = document.createElement('h4');
  title.textContent = key;
  title.className = 'text-sm font-medium text-gray-700';
  wrapper.appendChild(title);

  // Кнопки с возможными значениями
  values.forEach(value => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer text-sm mb-1';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `char_${key}`;
    radio.value = value;
    radio.className = 'mr-2';

    radio.addEventListener('change', () => {
      triggerFilterUpdate(document.getElementById('filterForm')); // Применяем фильтр
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(value));
    wrapper.appendChild(label);
  });

  // Вставляем в DOM
  container.appendChild(wrapper);
}

// Собираем данные формы и обновляем список товаров
function triggerFilterUpdate(form) {
  const formData = new URLSearchParams();

  // Обычные поля формы
  const formEntries = new FormData(form).entries();
  for (const [key, value] of formEntries) {
    if (value) {
      // Удаляем лишние [] у charFilter[]
      const cleanKey = key.replace(/\[\]$/, '');
      formData.append(cleanKey, value);
    }
  }

  // Добавляем выбранные чекбоксы "charFilter"
  form.querySelectorAll('input[name="charFilter"]:checked').forEach(cb => {
    formData.append('charFilter[]', cb.value);
  });

  const url = '/admin/products?' + formData.toString();

  console.log('Отправляем запрос:', url); // Отладка

  if (typeof updateProductList === 'function') {
    updateProductList(url);
  } else {
    console.error('updateProductList НЕ НАЙДЕНА!');
  }
}
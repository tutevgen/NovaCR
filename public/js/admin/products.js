document.addEventListener('DOMContentLoaded', () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  // === Модальное окно категорий ===
  const categoryModal = document.getElementById('categoryModal');
  const categoryForm = document.getElementById('categoryForm');
  const openCategoryBtn = document.getElementById('openCategoryBtn');
  const categorySearchInput = document.getElementById('categorySearch');
  let categories = [];

  function collectInitialCategories() {
    categories = [];
    document.querySelectorAll('[data-cat-id]').forEach(el => {
      const id = el.dataset.catId;
      const name = el.querySelector('span')?.textContent.trim();
      const parent = el.dataset.catParent || null;
      if (id && name) categories.push({ _id: id, name, parent });
    });
  }

  function renderCategoryList(filter = '') {
    const container = document.querySelector('.category-list');
    if (!container) return;

    container.innerHTML = '';
    const filtered = filter.toLowerCase();
    const roots = categories.filter(c => !c.parent && c.name.toLowerCase().includes(filtered));
    const childrenMap = {};

    categories.forEach(c => {
      if (c.parent) {
        (childrenMap[c.parent] ||= []).push(c);
      }
    });

    roots.forEach(cat => {
      const details = document.createElement('details');
      details.className = 'group border-b';
      details.dataset.catId = cat._id;
      details.dataset.catParent = '';

      const childItems = (childrenMap[cat._id] || []).map(sub => `
        <div class="flex justify-between items-center px-6 py-2" data-cat-id="${sub._id}" data-cat-parent="${sub.parent}">
          <span>${sub.name}</span>
          <div class="flex gap-2">
            <button data-action="edit" data-id="${sub._id}" class="text-gray-500 hover:text-blue-600">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button data-action="delete" data-id="${sub._id}" class="text-gray-500 hover:text-red-600">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `).join('');

      details.innerHTML = `
        <summary class="flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-gray-50">
          <span>${cat.name}</span>
          <div class="flex items-center gap-2">
            <button data-action="add-sub" data-id="${cat._id}" class="text-gray-500 hover:text-green-600" title="Добавить подкатегорию">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
            <button data-action="edit" data-id="${cat._id}" class="text-gray-500 hover:text-blue-600">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button data-action="delete" data-id="${cat._id}" class="text-gray-500 hover:text-red-600">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
            <i class="text-gray-400 w-4 h-4 group-open:rotate-180 transition" data-lucide="chevron-down"></i>
          </div>
        </summary>
        <div class="border-t bg-gray-50">${childItems}</div>
      `;

      container.appendChild(details);
    });

    lucide.createIcons();
    setTimeout(attachCategoryEvents, 50);
  }

  function attachCategoryEvents() {
    document.querySelectorAll('[data-action="edit"]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.id;
        const current = categories.find(c => c._id === id);
        const newName = prompt('Новое название:', current?.name);
        if (!newName || newName === current.name) return;

        try {
          const res = await fetch('/admin/products/categories/' + id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken ? { 'CSRF-Token': csrfToken } : {})
            },
            body: JSON.stringify({ name: newName })
          });

          if (res.ok) {
            current.name = newName;
            renderCategoryList(categorySearchInput?.value?.toLowerCase() || '');
          } else alert('Ошибка при редактировании');
        } catch (err) {
          console.error(err);
          alert('Ошибка при редактировании');
        }
      };
    });

    document.querySelectorAll('[data-action="delete"]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.id;
        const current = categories.find(c => c._id === id);
        if (!current) return;

        if (!confirm(`Удалить категорию "${current.name}"?`)) return;

        try {
          const res = await fetch('/admin/products/categories/' + id, {
            method: 'DELETE',
            headers: {
              ...(csrfToken ? { 'CSRF-Token': csrfToken } : {})
            }
          });

          if (res.ok) {
            categories = categories.filter(c => c._id !== id && c.parent !== id);
            renderCategoryList(categorySearchInput?.value?.toLowerCase() || '');
          } else {
            const msg = await res.text();
            alert(msg || 'Ошибка удаления');
          }
        } catch (err) {
          console.error(err);
          alert('Ошибка при удалении');
        }
      };
    });

    document.querySelectorAll('[data-action="add-sub"]').forEach(button => {
      button.onclick = async () => {
        const parentId = button.dataset.id;
        const name = prompt('Название подкатегории:');
        if (!name) return;

        try {
          const res = await fetch('/admin/products/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken ? { 'CSRF-Token': csrfToken } : {})
            },
            body: JSON.stringify({ name, parent: parentId })
          });

          if (res.ok) {
            const newCat = await res.json();
            categories.push(newCat);
            renderCategoryList(categorySearchInput?.value?.toLowerCase() || '');
          } else {
            alert('Ошибка при добавлении');
          }
        } catch (err) {
          console.error(err);
          alert('Ошибка при добавлении подкатегории');
        }
      };
    });
  }

  if (categoryForm) {
  categoryForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(categoryForm);
    const data = Object.fromEntries(formData.entries());

    console.log('Отправляемые данные:', data); // 👈 Отладка

    if (!data.name || !data.name.trim()) {
      alert('Введите название категории');
      return;
    }

    try {
      const res = await fetch('/admin/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const newCat = await res.json();
        categories.push(newCat);
        categoryModal?.classList.add('hidden');
        categoryForm.reset();
        renderCategoryList(categorySearchInput?.value?.toLowerCase() || '');
      } else {
        const json = await res.json();
        alert(json.error || 'Ошибка при добавлении категории');
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      alert('Ошибка сервера');
    }
  };
}

  openCategoryBtn?.addEventListener('click', () => {
    renderCategoryList();
    categoryModal?.classList.remove('hidden');
  });

  document.querySelectorAll('.close-category-modal').forEach(btn => {
    btn.onclick = () => categoryModal?.classList.add('hidden');
  });

  categorySearchInput?.addEventListener('input', () => {
    renderCategoryList(categorySearchInput.value.toLowerCase());
  });

  collectInitialCategories();
  renderCategoryList();

  // === Работа с товарами ===
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const errorBox = document.getElementById('productFormError');
  const photoInput = document.getElementById('productPhotoInput');
  const photoPreview = document.getElementById('productImagePreview');
  const removePhotoBtn = document.getElementById('removeProductPhoto');

  const charKeyInput = document.getElementById('charKey');
  const charValueInput = document.getElementById('charValue');
  const addCharBtn = document.getElementById('addCharBtn');
  const charList = document.getElementById('charList');
  const popularCharsSelect = document.getElementById('popularChars');
  const charJSON = document.getElementById('charJSON');

  // Добавление новой характеристики
  addCharBtn.addEventListener('click', () => {
    const key = charKeyInput.value.trim();
    const value = charValueInput.value.trim();
    if (!key || !value) return;

    const card = createCharCard(key, value);
    charList.appendChild(card);

    charKeyInput.value = '';
    charValueInput.value = '';
    popularCharsSelect.value = '';
    updateCharJSON();
  });

  // Подстановка популярной характеристики
  popularCharsSelect.addEventListener('change', () => {
    charKeyInput.value = popularCharsSelect.value;
  });

  // Создание карточки характеристики
  function createCharCard(key, value) {
    const card = document.createElement('div');
    card.className = 'flex items-center bg-gray-50 p-2 rounded border mt-2 gap-4';

    const span = document.createElement('span');
    span.innerHTML = `<strong>${key}</strong>: ${value}`;
    span.className = 'flex-1';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'text-blue-600 hover:text-blue-800 text-sm edit-char';
    editBtn.innerHTML = '<i data-lucide="pencil" class="w-4 h-4"></i>';
    editBtn.title = 'Редактировать';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-red-600 hover:text-red-800 text-sm delete-char';
    deleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    deleteBtn.title = 'Удалить';

    // Удаление
    deleteBtn.addEventListener('click', () => {
      charList.removeChild(card);
      updateCharJSON();
    });

    // Редактирование
    editBtn.addEventListener('click', () => {
      const oldKey = key;
      const oldValue = value;
      card.innerHTML = '';

      const inputKey = document.createElement('input');
      inputKey.type = 'text';
      inputKey.value = oldKey;
      inputKey.className = 'border border-gray-300 px-3 py-1 text-sm w-1/3 mr-2';

      const inputValue = document.createElement('input');
      inputValue.type = 'text';
      inputValue.value = oldValue;
      inputValue.className = 'border border-gray-300 px-3 py-1 text-sm w-1/3 mr-2';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'text-green-600 hover:text-green-800 text-sm save-char';
      saveBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
      saveBtn.title = 'Сохранить';

      card.appendChild(inputKey);
      card.appendChild(inputValue);
      card.appendChild(saveBtn);
      lucide.createIcons();

      saveBtn.addEventListener('click', () => {
        const newKey = inputKey.value.trim();
        const newValue = inputValue.value.trim();
        if (newKey && newValue) {
          const updatedCard = createCharCard(newKey, newValue);
          card.replaceWith(updatedCard);
          updateCharJSON();
        }
        
      });
    });

    card.appendChild(span);
    card.appendChild(editBtn);
    card.appendChild(deleteBtn);
    lucide.createIcons();
    return card;
  }

  // Обновление скрытого JSON-поля
  function updateCharJSON() {
  const chars = [];
  Array.from(charList.children).forEach(card => {
    let key, value;

    const strong = card.querySelector('strong');
    if (strong) {
      key = strong.textContent.trim();
      value = card.textContent.replace(strong.textContent, '').replace(':', '').trim();
    } else {
      const inputs = card.querySelectorAll('input[type="text"]');
      if (inputs.length >= 2) {
        key = inputs[0].value.trim();
        value = inputs[1].value.trim();
      }
    }

    if (key && value) {
      chars.push({ key, value });
    }
  });

  charJSON.value = JSON.stringify(chars);
}

  // Открытие модального окна товара
  function openProductModal(product = null) {
    const form = document.getElementById('productForm');
    form.reset();
    charList.innerHTML = '';
    charJSON.value = '';
    form.querySelector('input[name="_id"]').value = '';
    if (photoPreview) photoPreview.src = '';
    if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
    popularCharsSelect.value = '';

    if (product) {
      form.querySelector('input[name="_id"]').value = product._id || '';
      form.querySelector('input[name="name"]').value = product.name || '';
      form.querySelector('select[name="category"]').value = product.category?._id || '';
      form.querySelector('input[name="warehouse"]').value = product.warehouse || '';
      form.querySelector('input[name="price"]').value = product.price || '';
      form.querySelector('input[name="wholesalePrice"]').value = product.wholesalePrice || '';
      form.querySelector('input[name="quantity"]').value = product.quantity || '';
      form.querySelector('textarea[name="description"]').value = product.description || '';

      if (product.characteristics && typeof product.characteristics === 'object') {
        Object.entries(product.characteristics).forEach(([key, value]) => {
          const card = createCharCard(key, value);
          charList.appendChild(card);
        });
      }

      updateCharJSON();

      if (product.photo && photoPreview) {
        photoPreview.src = product.photo;
        photoPreview.classList.remove('hidden');
        removePhotoBtn.classList.remove('hidden');
      }
    }

    productModal?.classList.remove('hidden');
    lucide.createIcons();
  }

  function closeProductModal() {
    productModal?.classList.add('hidden');
    const input = document.querySelector('input[name="removePhoto"]');
    if (input) input.remove();
  }

  document.getElementById('openProductBtn')?.addEventListener('click', () => {
    openProductModal();
  });

  document.querySelectorAll('.close-product-modal').forEach(btn => {
    btn.addEventListener('click', closeProductModal);
  });

  document.querySelectorAll('.edit-product-btn').forEach(button => {
    button.addEventListener('click', () => {
      const row = button.closest('tr');
      const productData = row?.dataset?.product;
      if (!productData) return;
      const product = JSON.parse(productData);
      openProductModal(product);
    });
  });

  // Предпросмотр фото
  if (photoInput && photoPreview && removePhotoBtn) {
    photoInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          photoPreview.src = e.target.result;
          photoPreview.classList.remove('hidden');
          removePhotoBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    removePhotoBtn.addEventListener('click', function() {
      photoPreview.src = '';
      photoPreview.classList.add('hidden');
      this.classList.add('hidden');
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'removePhoto';
      input.value = 'true';
      productForm.appendChild(input);
    });
  }


 
  // === Отправка формы товара ===
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  updateCharJSON(); // <<< Обязательно вызываем перед отправкой

  const formData = new FormData(productForm);
  const productId = formData.get('_id');
  const url = productId ? `/admin/products/${productId}` : '/admin/products';
  const method = productId ? 'PUT' : 'POST';

  if (charJSON.value) {
    formData.set('characteristics', charJSON.value);
  }

  // 👇 Добавь это для отладки
  console.log('Отправляемые данные:', {
    name: formData.get('name'),
    category: formData.get('category'), // <<< Проверяем значение категории
    characteristics: JSON.parse(formData.get('characteristics') || '{}'),
  });

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'CSRF-Token': csrfToken
      },
      body: formData
    });

    if (res.ok) {
      errorBox.classList.add('hidden');
      alert(productId ? 'Товар обновлён' : 'Товар добавлен');
      closeProductModal();
      productForm.reset();
      window.updateProductList();
    } else {
      const json = await res.json();
      errorBox.textContent = json.error || 'Ошибка при сохранении товара';
      errorBox.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Ошибка:', err);
    errorBox.textContent = 'Серверная ошибка';
    errorBox.classList.remove('hidden');
  }
});

  // Удаление товара
  document.querySelectorAll('.delete-product-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const row = button.closest('tr');
      const id = row?.dataset?.id;
      const name = row?.querySelector('td:nth-child(2)').textContent.trim();

      if (!id || !confirm(`Удалить товар "${name}"?`)) return;

      try {
        const res = await fetch(`/admin/products/${id}`, {
          method: 'DELETE',
          headers: { 'CSRF-Token': csrfToken }
        });

        if (res.ok) {
          row.remove();
          alert('Товар удалён');
        } else {
          const msg = await res.text();
          alert(msg || 'Ошибка при удалении');
        }
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Ошибка при удалении');
      }
    });
  });

  // ==== Обновление списка товаров ====
  window.updateProductList = async function (url = '/admin/products') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка загрузки данных');

    const data = await res.json(); // Теперь это JSON, а не HTML
    const oldTbody = document.querySelector('table tbody');

    data.products.forEach(product => {
      const row = createProductRow(product);
      oldTbody.appendChild(row);
    });

    window.bindProductActions?.();
    window.initProductVisibility?.(csrfToken);
    lucide.createIcons();

  } catch (err) {
    console.error('Не удалось обновить список товаров:', err);
  }
};

  window.bindProductActions = function () {
    document.querySelectorAll('.edit-product-btn').forEach(button => {
      button.removeEventListener('click', window.editHandler);
      button.addEventListener('click', window.editHandler);
    });

    document.querySelectorAll('.delete-product-btn').forEach(button => {
      button.removeEventListener('click', window.deleteHandler);
      button.addEventListener('click', window.deleteHandler);
    });

    document.querySelectorAll('.toggle-visibility').forEach(toggle => {
      toggle.removeEventListener('change', window.initProductVisibility);
      toggle.addEventListener('change', window.initProductVisibility);
    });
  };

  window.editHandler = function () {
    const row = this.closest('tr');
    const productData = row?.dataset?.product;
    if (!productData) return;
    const product = JSON.parse(productData);
    openProductModal(product);
  };

  window.deleteHandler = function () {
    const row = this.closest('tr');
    const id = row?.dataset?.id;
    const name = row?.querySelector('td:nth-child(2)').textContent.trim();

    if (!id || !confirm(`Удалить товар "${name}"?`)) return;

    fetch(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'CSRF-Token': csrfToken }
    }).then(res => {
      if (res.ok) {
        row.remove();
        alert('Товар удалён');
      } else {
        res.text().then(text => alert(text || 'Ошибка при удалении'));
      }
    }).catch(err => {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении');
    });
  };

  lucide.createIcons();
  bindProductActions();
});
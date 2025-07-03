const Product = require('../../models/admin/Product');
const Category = require('../../models/Category');
const ProductLog = require('../../models/ProductLog');
const fs = require('fs');
const path = require('path');

// === Товары ===
exports.listProducts = async (req, res) => {
  try {
    const { search, category, charKey, charValue, isVisible, sort } = req.query;
    let filter = {};

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (charKey && charValue) {
  filter[`characteristics.${charKey}`] = { $regex: charValue, $options: 'i' };
}
    if (isVisible !== undefined && isVisible !== '') filter.isVisible = isVisible === 'true';

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const [products, total, logs, categories] = await Promise.all([
      Product.find(filter).populate('category').sort(getSortOptions(sort)).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      ProductLog.find().populate('user').populate('product').sort({ timestamp: -1 }).lean(),
      Category.find().lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    const allCharKeys = new Set();
    products.forEach(product => {
      if (product.characteristics && typeof product.characteristics === 'object') {
        Object.keys(product.characteristics).forEach(key => {
          allCharKeys.add(key);
        });
      }
    });

    const groupedCategories = [];
    const parentMap = {};
    categories.forEach(cat => {
      if (!cat.parent) {
        groupedCategories.push({
          label: cat.name,
          options: []
        });
        parentMap[cat._id.toString()] = groupedCategories.length - 1;
      } else {
        const parentIndex = Object.keys(parentMap).find(key => key === cat.parent.toString());
        if (parentIndex !== undefined) {
          groupedCategories[parentMap[parentIndex]].options.push(cat);
        }
      }
    });

    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ products, page, totalPages });
    }

    res.render('pages/admin/products', {
      title: 'Товары',
      activePage: 'products',
      user: req.session.user,
      products,
      page,
      totalPages,
      search: req.query.search || '',
      category: req.query.category || '',
      charKey: req.query.charKey || '',
      charValue: req.query.charValue || '',
      isVisible: req.query.isVisible || '',
      sort: req.query.sort || '',
      logs,
      categories,
      groupedCategories,
      allCharKeys: Array.from(allCharKeys),
      showCategoryForm: false,
      product: null
    });

  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).send('Ошибка при загрузке товаров');
  }
};




// === Создание товара ===
exports.createProduct = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await Product.findOne({ name }).lean();
    if (existing) {
      return res.status(400).json({ error: 'Товар с таким названием уже существует' });
    }

    let characteristics = {};
    if (req.body.characteristics) {
      try {
        const parsed = JSON.parse(req.body.characteristics);
        if (Array.isArray(parsed)) {
          parsed.forEach(({ key, value }) => {
            if (key && value) {
              characteristics[key.trim()] = value.trim();
            }
          });
        }
      } catch (e) {
        console.warn("Ошибка парсинга характеристик:", e.message);
      }
    }

    const product = new Product({
      name,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || null,
      quantity: req.body.quantity,
      warehouse: req.body.warehouse || '',
      wholesalePrice: req.body.wholesalePrice || '',
      characteristics,
      createdBy: req.session?.user?._id || null,
      photo: req.file ? `/uploads/products/${req.file.filename}` : null
    });

    await product.save();

    res.status(201).json({ message: 'Товар успешно добавлен', product });

  } catch (error) {
    console.error('Ошибка при создании товара:', error);
    res.status(500).json({ error: 'Ошибка сервера при добавлении товара' });
  }
};

// === Обновление товара ===
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const { name } = req.body;
    const existing = await Product.findOne({ name, _id: { $ne: id } }).lean();
    if (existing) {
      return res.status(400).json({ error: 'Товар с таким названием уже существует' });
    }

    let characteristics = {};
    if (req.body.characteristics) {
      try {
        const parsed = JSON.parse(req.body.characteristics);
        if (Array.isArray(parsed)) {
          parsed.forEach(({ key, value }) => {
            if (key && value) {
              characteristics[key.trim()] = value.trim();
            }
          });
        }
      } catch (e) {
        console.warn("Ошибка парсинга характеристик:", e.message);
      }
    }

    const updateData = {
      name,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || null,
      quantity: req.body.quantity,
      warehouse: req.body.warehouse || '',
      wholesalePrice: req.body.wholesalePrice || '',
      characteristics,
      updatedBy: req.session?.user?._id || null
    };

    if (req.file) {
      if (product.photo) {
        const oldImagePath = path.join(__dirname, '../../public', product.photo);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.photo = `/uploads/products/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: 'Товар успешно обновлён', product: updatedProduct });

  } catch (error) {
    console.error('Ошибка при обновлении товара:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении товара' });
  }
};

// === Удаление товара ===
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (product.photo) {
      const imagePath = path.join(__dirname, '../../public', product.photo);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(id);
    res.json({ success: true });

  } catch (err) {
    console.error('Ошибка при удалении товара:', err);
    res.status(500).json({ error: 'Ошибка сервера при удалении товара' });
  }
};

// === Категории ===
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.json(categories);
  } catch (err) {
    console.error("Ошибка при получении категорий:", err);
    res.status(500).json({ error: 'Ошибка сервера при получении категорий' });
  }
};

exports.createCategory = async (req, res) => {
  const { name, parent } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Название обязательно' });
  }

  const category = new Category({
    name,
    parent: parent && parent !== '' ? parent : null
  });

  try {
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Ошибка при создании категории:", err.message);
    res.status(500).json({ error: 'Ошибка сервера при создании категории' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const hasProducts = await Product.exists({ category: id });
    if (hasProducts) {
      return res.status(400).json({ error: 'К категории привязаны товары' });
    }

    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      return res.status(400).json({ error: 'У категории есть подкатегории' });
    }

    await Category.findByIdAndDelete(id);
    res.json({ success: true });

  } catch (err) {
    console.error("Ошибка при удалении категории:", err);
    res.status(500).json({ error: 'Ошибка сервера при удалении категории' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });
    res.json(category);
  } catch (err) {
    console.error("Ошибка при обновлении категории:", err);
    res.status(500).json({ error: 'Ошибка сервера при обновлении' });
  }
};

// === Видимость товара ===
exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    product.isVisible = !product.isVisible;
    await product.save();
    res.json({ success: true, isVisible: product.isVisible });

  } catch (err) {
    console.error('Ошибка при изменении видимости товара:', err);
    res.status(500).json({ error: 'Ошибка сервера при изменении видимости' });
  }
};

// === Характеристики ===
exports.getCharValues = async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Не указан ключ' });

    const products = await Product.find({ [`characteristics.${key}`]: { $exists: true } }).lean();
    const values = new Set();
    products.forEach(p => {
      const val = p.characteristics?.[key];
      if (val) values.add(val.trim());
    });

    res.json([...values].sort());

  } catch (err) {
    console.error('Ошибка при получении значений характеристик:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// === Вспомогательные функции ===
function getSortOptions(sort) {
  switch (sort) {
    case 'name_asc': return { name: 1 };
    case 'name_desc': return { name: -1 };
    case 'price_asc': return { price: 1 };
    case 'price_desc': return { price: -1 };
    case 'newest': return { createdAt: -1 };
    case 'oldest': return { createdAt: 1 };
    default: return { createdAt: -1 };
  }
}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, seedProductsIfEmpty, closeDB } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

function validateProductInput(body) {
  const requiredFields = ['name', 'category', 'price', 'image', 'stock'];
  const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');

  if (missingFields.length > 0) {
    return `Missing required field(s): ${missingFields.join(', ')}`;
  }

  if (typeof body.price !== 'number' || Number.isNaN(body.price) || body.price <= 0) {
    return 'price must be a number greater than 0';
  }

  if (!Number.isInteger(body.stock) || body.stock < 0) {
    return 'stock must be an integer greater than or equal to 0';
  }

  return null;
}

async function getProductsCollection() {
  const db = await connectDB();
  return db.collection('products');
}

app.get('/products', async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const { category, search } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await productsCollection
      .find(query, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray();

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const productsCollection = await getProductsCollection();

    const product = await productsCollection.findOne({ id }, { projection: { _id: 0 } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const productsCollection = await getProductsCollection();
    const maxProduct = await productsCollection
      .find({}, { projection: { id: 1, _id: 0 } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const nextId = maxProduct.length > 0 ? maxProduct[0].id + 1 : 1;

    const newProduct = {
      id: nextId,
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      image: req.body.image,
      stock: req.body.stock,
    };

    await productsCollection.insertOne(newProduct);
    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validationError = validateProductInput(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const productsCollection = await getProductsCollection();
    const updatedProduct = {
      id,
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      image: req.body.image,
      stock: req.body.stock,
    };

    const result = await productsCollection.updateOne({ id }, { $set: updatedProduct });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const productsCollection = await getProductsCollection();

    const result = await productsCollection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

(async () => {
  try {
    await connectDB();
    await seedProductsIfEmpty();

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

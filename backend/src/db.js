const { MongoClient } = require('mongodb');
const fs = require('fs/promises');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'midterm_store';

let client;
let db;

async function connectDB() {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);

  return db;
}

async function seedProductsIfEmpty() {
  const database = await connectDB();
  const productsCollection = database.collection('products');

  const count = await productsCollection.countDocuments();
  if (count > 0) {
    return;
  }

  const productsFilePath = path.join(__dirname, '..', 'data', 'products.json');
  const raw = await fs.readFile(productsFilePath, 'utf-8');
  const seedProducts = JSON.parse(raw);

  if (seedProducts.length > 0) {
    await productsCollection.insertMany(seedProducts);
  }
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectDB,
  seedProductsIfEmpty,
  closeDB,
};

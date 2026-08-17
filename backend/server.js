const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ── In-memory data ────────────────────────────────────────────────────────────

let products = [
  { id: 1, name: "Wireless Headphones", price: 79.99, category: "Electronics", stock: 15, image: "🎧" },
  { id: 2, name: "Running Shoes", price: 59.99, category: "Sports", stock: 8, image: "👟" },
  { id: 3, name: "Coffee Maker", price: 49.99, category: "Home", stock: 20, image: "☕" },
  { id: 4, name: "Backpack", price: 39.99, category: "Accessories", stock: 12, image: "🎒" },
  { id: 5, name: "Sunglasses", price: 29.99, category: "Accessories", stock: 25, image: "🕶️" },
  { id: 6, name: "Yoga Mat", price: 24.99, category: "Sports", stock: 30, image: "🧘" },
];

let orders = [];
let nextOrderId = 1;

// ── Products ──────────────────────────────────────────────────────────────────

// GET all products (optional ?category= filter)
app.get("/api/products", (req, res) => {
  const { category } = req.query;
  const result = category
    ? products.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    : products;
  res.json(result);
});

// GET single product
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// GET all categories
app.get("/api/categories", (req, res) => {
  const categories = [...new Set(products.map((p) => p.category))];
  res.json(categories);
});

// ── Cart / Orders ─────────────────────────────────────────────────────────────

// POST create order  { items: [{ productId, quantity }], customer: { name, email, address } }
app.post("/api/orders", (req, res) => {
  const { items, customer } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ error: "Order must contain at least one item" });
  if (!customer || !customer.name || !customer.email)
    return res.status(400).json({ error: "Customer name and email are required" });

  // Validate stock and build order lines
  const orderItems = [];
  for (const { productId, quantity } of items) {
    const product = products.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ error: `Product ${productId} not found` });
    if (product.stock < quantity)
      return res.status(400).json({ error: `Not enough stock for "${product.name}"` });
    orderItems.push({ product: { ...product }, quantity, subtotal: product.price * quantity });
  }

  // Deduct stock
  for (const { productId, quantity } of items) {
    const product = products.find((p) => p.id === productId);
    product.stock -= quantity;
  }

  const total = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
  const order = {
    id: nextOrderId++,
    customer,
    items: orderItems,
    total: parseFloat(total.toFixed(2)),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  res.status(201).json(order);
});

// GET all orders
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

// GET single order
app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Backend running at http://localhost:${PORT}`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/products/:id`);
  console.log(`   GET  /api/categories`);
  console.log(`   POST /api/orders`);
  console.log(`   GET  /api/orders`);
});

const API = "http://localhost:3000/api";

// ── State ──────────────────────────────────────────────────────────────────────
let cart = []; // [{ product, quantity }]

// ── DOM refs ───────────────────────────────────────────────────────────────────
const productGrid  = document.getElementById("productGrid");
const filtersEl    = document.getElementById("filters");
const cartBtn      = document.getElementById("cartBtn");
const cartSidebar  = document.getElementById("cartSidebar");
const closeCart    = document.getElementById("closeCart");
const overlay      = document.getElementById("overlay");
const cartItemsEl  = document.getElementById("cartItems");
const cartTotal    = document.getElementById("cartTotal");
const cartCount    = document.getElementById("cartCount");
const checkoutBtn  = document.getElementById("checkoutBtn");
const checkoutModal= document.getElementById("checkoutModal");
const cancelChkout = document.getElementById("cancelCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const toast        = document.getElementById("toast");

// ── Utilities ──────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2400) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function formatPrice(n) {
  return "$" + Number(n).toFixed(2);
}

// ── Products ───────────────────────────────────────────────────────────────────
async function loadCategories() {
  const cats = await fetch(`${API}/categories`).then((r) => r.json());
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener("click", () => selectCategory(cat, btn));
    filtersEl.appendChild(btn);
  });
}

function selectCategory(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  loadProducts(cat);
}

async function loadProducts(category = "") {
  productGrid.innerHTML = `<p class="loading">Loading products…</p>`;
  const url = category ? `${API}/products?category=${category}` : `${API}/products`;
  const products = await fetch(url).then((r) => r.json()).catch(() => []);

  if (!products.length) {
    productGrid.innerHTML = `<p class="loading">No products found.</p>`;
    return;
  }

  productGrid.innerHTML = products.map((p) => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img">${p.image}</div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <p class="product-category">${p.category}</p>
        <p class="product-price">${formatPrice(p.price)}</p>
        <p class="product-stock ${p.stock <= 3 ? "low" : ""}">
          ${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
        </p>
      </div>
      <button class="btn-add" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
        ${p.stock === 0 ? "Out of stock" : "Add to cart"}
      </button>
    </div>
  `).join("");

  // Bind add-to-cart buttons
  productGrid.querySelectorAll(".btn-add:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = products.find((p) => p.id === Number(btn.dataset.id));
      addToCart(product);
    });
  });
}

// ── Cart logic ─────────────────────────────────────────────────────────────────
function addToCart(product) {
  const existing = cart.find((c) => c.product.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }
  renderCart();
  showToast(`✔ ${product.name} added to cart`);
}

function removeFromCart(productId) {
  cart = cart.filter((c) => c.product.id !== productId);
  renderCart();
}

function changeQty(productId, delta) {
  const item = cart.find((c) => c.product.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(productId);
  else renderCart();
}

function renderCart() {
  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  cartCount.textContent = count;
  cartTotal.textContent = formatPrice(total);

  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty 🛒</p>`;
    return;
  }

  cartItemsEl.innerHTML = cart.map((c) => `
    <div class="cart-item" data-id="${c.product.id}">
      <span class="cart-item-emoji">${c.product.image}</span>
      <div style="flex:1">
        <p class="cart-item-name">${c.product.name}</p>
        <p class="cart-item-price">${formatPrice(c.product.price)}</p>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${c.product.id}" data-delta="-1">−</button>
        <span class="qty-value">${c.quantity}</span>
        <button class="qty-btn" data-id="${c.product.id}" data-delta="1">+</button>
      </div>
    </div>
  `).join("");

  cartItemsEl.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      changeQty(Number(btn.dataset.id), Number(btn.dataset.delta))
    );
  });
}

// ── Cart sidebar open / close ──────────────────────────────────────────────────
function openCart()  { cartSidebar.classList.add("open");  overlay.classList.add("show"); }
function closeCartFn(){ cartSidebar.classList.remove("open"); overlay.classList.remove("show"); closeModal(); }

cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartFn);
overlay.addEventListener("click", closeCartFn);

// ── Checkout ───────────────────────────────────────────────────────────────────
function openModal()  { checkoutModal.classList.add("show"); }
function closeModal() { checkoutModal.classList.remove("show"); }

checkoutBtn.addEventListener("click", () => {
  if (!cart.length) { showToast("⚠️ Your cart is empty!"); return; }
  openModal();
});
cancelChkout.addEventListener("click", closeModal);

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const customer = {
    name:    document.getElementById("custName").value.trim(),
    email:   document.getElementById("custEmail").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
  };
  const items = cart.map((c) => ({ productId: c.product.id, quantity: c.quantity }));

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, customer }),
  });

  if (res.ok) {
    const order = await res.json();
    cart = [];
    renderCart();
    closeModal();
    closeCartFn();
    checkoutForm.reset();
    showToast(`🎉 Order #${order.id} placed! Total: ${formatPrice(order.total)}`, 3500);
    // Refresh product stock on grid
    const activeFilter = document.querySelector(".filter-btn.active")?.dataset.category || "";
    loadProducts(activeFilter);
  } else {
    const err = await res.json();
    showToast(`❌ ${err.error}`, 3000);
  }
});

// ── Init ───────────────────────────────────────────────────────────────────────
document.querySelector(".filter-btn[data-category='']").addEventListener("click", function () {
  selectCategory("", this);
});

(async () => {
  await loadCategories();
  await loadProducts();
})();

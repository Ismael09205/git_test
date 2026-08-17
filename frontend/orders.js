const API = "http://localhost:3000/api";

const orderList = document.getElementById("orderList");

function formatPrice(n) {
  return "$" + Number(n).toFixed(2);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

async function loadOrders() {
  const orders = await fetch(`${API}/orders`).then((r) => r.json()).catch(() => null);

  if (!orders) {
    orderList.innerHTML = `<p class="error">Could not connect to server. Make sure the backend is running.</p>`;
    return;
  }

  if (!orders.length) {
    orderList.innerHTML = `<p class="loading">No orders yet. Go shop something! 🛒</p>`;
    return;
  }

  orderList.innerHTML = orders
    .slice()
    .reverse()
    .map(
      (o) => `
    <div class="order-card">
      <h3>Order #${o.id} <span class="status-badge">${o.status}</span></h3>
      <p class="order-meta">
        ${o.customer.name} &bull; ${o.customer.email}
        ${o.customer.address ? " &bull; " + o.customer.address : ""}
        <br/>Placed: ${formatDate(o.createdAt)}
      </p>
      <ul class="order-items">
        ${o.items
          .map(
            (i) =>
              `<li>${i.product.image} ${i.product.name} × ${i.quantity} — ${formatPrice(i.subtotal)}</li>`
          )
          .join("")}
      </ul>
      <p class="order-total">Total: ${formatPrice(o.total)}</p>
    </div>
  `
    )
    .join("");
}

loadOrders();

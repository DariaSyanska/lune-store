let activeFilters = {
  categories: [],
  colors: [],
  sizes: [],
  sort: "newest",
};

// ─── ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ КАТАЛОГА ─────────────────────────────────────

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  let filteredProducts = PRODUCTS.filter((product) => {
    const categoryMatch =
      activeFilters.categories.length === 0 ||
      activeFilters.categories.includes(product.category);

    const colorMatch =
      activeFilters.colors.length === 0 ||
      product.colors.some((color) => activeFilters.colors.includes(color));

    const sizeMatch =
      activeFilters.sizes.length === 0 ||
      product.sizes.some((size) => activeFilters.sizes.includes(size));

    return categoryMatch && colorMatch && sizeMatch;
  });

  if (activeFilters.sort === "price-low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (activeFilters.sort === "price-high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (activeFilters.sort === "newest") {
    filteredProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (filteredProducts.length === 0) {
    grid.innerHTML =
      '<p class="no-results">No products match your criteria.</p>';
    return;
  }

  grid.innerHTML = filteredProducts
    .map(
      (p) => `
  <div class="product-card">
    <div class="product-img-wrapper">
      <div class="product-img open-product" data-id="${p.id}">
        <img src="images/${p.id}.jpg" alt="${p.name}">
      </div>
      
      <button class="wish-btn" data-id="${p.id}" aria-label="Add to wishlist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      <button class="quick-add-btn" 
        data-title="${p.name}" 
        data-price="${p.price}" 
        data-img="images/${p.id}.jpg">
        + Quick Add
      </button>
    </div>
    <div class="product-info">
      <p class="product-name">${p.name}</p>
      <p class="product-price">€ ${p.price}</p>
    </div>
  </div>
`,
    )
    .join("");

  if (typeof initModals === "function") initModals();
  if (typeof initQuickAdd === "function") initQuickAdd();
  if (typeof initWishlistButtons === "function") initWishlistButtons(); // ДОБАВЬ ЭТО
  if (typeof updateWishlistUI === "function") updateWishlistUI(); // И ЭТО
}

// ─── УПРАВЛЕНИЕ ФИЛЬТРАМИ (EVENT LISTENERS) ──────────────────────────────────

document.getElementById("sort-select")?.addEventListener("change", (e) => {
  activeFilters.sort = e.target.value;
  renderCatalog();
});

const categoryInputs = document.querySelectorAll("#category-filters input");
categoryInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      activeFilters.categories.push(value);
    } else {
      activeFilters.categories = activeFilters.categories.filter(
        (c) => c !== value,
      );
    }
    renderCatalog();
  });
});

const colorDots = document.querySelectorAll("#color-filters .color-dot");
colorDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const color = dot.dataset.color;

    dot.classList.toggle("active");

    if (dot.classList.contains("active")) {
      activeFilters.colors.push(color);
    } else {
      activeFilters.colors = activeFilters.colors.filter((c) => c !== color);
    }
    renderCatalog();
  });
});

const sizeBtns = document.querySelectorAll("#size-filters .filter-size-btn");
sizeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = btn.textContent;

    btn.classList.toggle("active");

    if (btn.classList.contains("active")) {
      activeFilters.sizes.push(size);
    } else {
      activeFilters.sizes = activeFilters.sizes.filter((s) => s !== size);
    }
    renderCatalog();
  });
});

document.getElementById("reset-filters")?.addEventListener("click", () => {
  activeFilters = { categories: [], colors: [], sizes: [], sort: "newest" };

  categoryInputs.forEach((input) => (input.checked = false));
  colorDots.forEach((dot) => dot.classList.remove("active"));
  sizeBtns.forEach((btn) => btn.classList.remove("active"));

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "newest";

  renderCatalog();
});

// ─── ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
});

// Функция для активации фильтра из URL
function applyUrlFilter() {
  const hash = window.location.hash.replace("#", "");

  if (hash) {
    setTimeout(() => {
      const productCard = document.querySelector(
        `.open-product[data-id="${hash}"]`,
      );

      if (productCard) {
        productCard.click();
        history.replaceState(null, null, " ");
        return;
      }

      const checkbox = document.querySelector(
        `#category-filters input[value="${hash}"]`,
      );
      if (checkbox) {
        activeFilters.categories = [hash];
        checkbox.checked = true;
        renderCatalog();
      }
    }, 200);
  }
}

document.addEventListener("DOMContentLoaded", applyUrlFilter);

window.addEventListener("hashchange", () => {
  categoryInputs.forEach((input) => (input.checked = false));
  applyUrlFilter();
});

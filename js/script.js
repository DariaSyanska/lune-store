// ─── 0. ТЕМА — переключатель dark/light и Favicon ────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const favicon = document.getElementById("favicon");

const FAVICONS = {
  dark: "images/favicon-dark.png",
  light: "images/favicon.png",
};

const savedTheme = localStorage.getItem("lune-theme") || "dark";
html.setAttribute("data-theme", savedTheme);
if (favicon) favicon.href = FAVICONS[savedTheme];

themeToggle?.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("lune-theme", next);
  if (favicon) favicon.href = FAVICONS[next];

  const nextBg = next === "dark" ? "#0a0a0f" : "#f5f2ea";

  gsap.to("body", { backgroundColor: nextBg, duration: 0.5 });
});

// ─── 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ХЕДЕР ────────────────────────────────────────
const header = document.querySelector("header");
const modal = document.getElementById("product-modal-overlay");
const modalAddBtn = document.getElementById("modal-add-btn");
const closeModalBtn = document.getElementById("product-modal-close");

let currentProductId = "";
let cart = JSON.parse(localStorage.getItem("lune-cart")) || [];

window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("scrolled", window.scrollY > 40);
  },
  { passive: true },
);

// Wishlist Logic
let wishlist = JSON.parse(localStorage.getItem("lune-wishlist")) || [];

function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(productId);
  }
  localStorage.setItem("lune-wishlist", JSON.stringify(wishlist));
  updateWishlistUI();
}

function updateWishlistUI() {
  const countEls = document.querySelectorAll(".wishlist-count");

  const wishlistLength = wishlist.length;

  countEls.forEach((el) => {
    el.textContent = wishlistLength;

    if (wishlistLength > 0) {
      el.style.display = "flex";
    } else {
      el.style.display = "none";
    }
  });

  document.querySelectorAll(".wish-btn").forEach((btn) => {
    const id = btn.dataset.id;
    btn.classList.toggle("active", wishlist.includes(id));
  });
}

// ─── 2. ПЛАВНЫЙ СКРОЛЛ (LENIS) ───────────────────────────────────────────────
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.5,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

if (typeof ScrollTrigger !== "undefined") {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ScrollTrigger.refresh() будет вызван после полной загрузки страницы, чтобы гарантировать правильные позиции триггеров
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ─── 3. АНИМАЦИИ GSAP (HERO & CATALOG) ───────────────────────────────────────
if (typeof gsap !== "undefined") {
  const heroSelectors = [
    ".hero-moon",
    ".hero-glow",
    ".hero-text",
    ".hero-scroll-indicator",
  ];
  heroSelectors.forEach((selector) => {
    const el = document.querySelector(selector);
    if (el) {
      gsap.to(el, {
        y: selector.includes("text") ? "-25%" : "15%",
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  });

  const cards = document.querySelectorAll(".product-card");
  if (cards.length) {
    gsap.from(cards, {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".catalog-section",
        start: "top 80%",
        once: true,
      },
    });
  }
}

// ─── 4. ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ КАТАЛОГА ───────────────────────────────────────
const track = document.querySelector(".catalog-track");
const progressBar = document.querySelector(".catalog-progress-bar");

if (track) {
  const updateProgress = () => {
    if (!progressBar) return;
    const max = track.scrollWidth - track.clientWidth;
    progressBar.style.width =
      max > 0 ? (track.scrollLeft / max) * 100 + "%" : "0%";
  };

  track.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY * 0.8;
        updateProgress();
      }
    },
    { passive: false },
  );

  let isDragging = false,
    startX,
    scrollLeft;
  const startAction = (e) => {
    isDragging = true;
    startX = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  };
  const moveAction = (e) => {
    if (!isDragging) return;
    const x = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
    const walk = x - startX;
    track.scrollLeft = scrollLeft - walk;
    updateProgress();
  };

  track.addEventListener("mousedown", startAction);
  track.addEventListener("touchstart", startAction, { passive: true });
  window.addEventListener("mouseup", () => (isDragging = false));
  window.addEventListener("mousemove", moveAction);
  track.addEventListener("touchmove", moveAction, { passive: true });
}

// ─── 5. ЛОГИКА МОДАЛЬНОГО ОКНА ───────────────────────────────────────────────
function initModals() {
  const openModalBtns = document.querySelectorAll(".open-product");
  openModalBtns.forEach((btn) => {
    if (btn.getAttribute("data-initialized")) return;
    btn.addEventListener("click", (e) => {
      if (e.target.classList.contains("quick-add-btn")) return;

      currentProductId = btn.dataset.id;
      const card = btn.closest(".product-card");
      document.getElementById("modal-title").textContent =
        card.querySelector(".product-name").textContent;
      document.getElementById("modal-price").textContent =
        card.querySelector(".product-price").textContent;
      document.getElementById("modal-img").src =
        `images/${currentProductId}.jpg`;

      resetModalSelections();
      modal?.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    btn.setAttribute("data-initialized", "true");
  });
}

function resetModalSelections() {
  if (!modal) return;
  modal
    .querySelectorAll(".color-btn")
    .forEach((b, i) => b.classList.toggle("active", i === 0));
  modal
    .querySelectorAll(".size-btn")
    .forEach((b, i) => b.classList.toggle("active", i === 1));
  const colorLabel = document.getElementById("modal-color-name");
  if (colorLabel) colorLabel.textContent = "Ivory";
}

const closeModal = () => {
  modal?.classList.remove("active");
  document.body.style.overflow = "";
};

closeModalBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => e.target === modal && closeModal());

// Modal Options Selection
modal?.querySelectorAll(".color-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal
      .querySelectorAll(".color-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const color = btn.getAttribute("aria-label").toLowerCase();
    const suffix = color.includes("black")
      ? "-2"
      : color.includes("violet")
        ? "-3"
        : color.includes("pink")
          ? "-4"
          : color.includes("blue")
            ? "-5"
            : color.includes("yellow")
              ? "-6"
              : color.includes("teal")
                ? "-7"
                : "";
    document.getElementById("modal-img").src =
      `images/${currentProductId}${suffix}.jpg`;
    document.getElementById("modal-color-name").textContent =
      btn.getAttribute("aria-label");
  });
});

modal?.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal
      .querySelectorAll(".size-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ─── 6. КОРЗИНА И QUICK ADD ──────────────────────────────────────────────────
function saveAndRenderCart() {
  localStorage.setItem("lune-cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const cartBody = document.querySelector(".cart-body");
  const subtotalEl = document.querySelector(".cart-total span:last-child");
  const cartCountEls = document.querySelectorAll(".cart-count");

  if (!cartBody) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCountEls.forEach((el) => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? "flex" : "none";
  });

  if (cart.length === 0) {
    cartBody.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
    if (subtotalEl) subtotalEl.textContent = "€ 0";
    return;
  }

  let total = 0;
  cartBody.innerHTML = cart
    .map((item, index) => {
      total += item.price * item.quantity;
      return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="item-header-row">
            <p class="cart-item-title">${item.title}</p>
            <p class="cart-item-price">€ ${item.price * item.quantity}</p>
          </div>
          <p class="cart-item-variant">${item.variant}</p>
          <div class="cart-item-controls">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeItem(${index})">Remove</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
  if (subtotalEl) subtotalEl.textContent = `€ ${total}`;
}

window.updateQty = (index, change) => {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveAndRenderCart();
};

window.removeItem = (index) => {
  cart.splice(index, 1);
  saveAndRenderCart();
};

function initQuickAdd() {
  document.querySelectorAll(".quick-add-btn").forEach((btn) => {
    if (btn.getAttribute("data-q-init")) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const item = {
        title: this.dataset.title,
        price: parseInt(this.dataset.price),
        img: this.dataset.img,
        variant: "Default / S",
        quantity: 1,
      };
      addToCartLogic(item);
      this.innerText = "Added ✓";
      toggleCart(null, true);
      setTimeout(() => (this.innerText = "+ Quick Add"), 2000);
    });
    btn.setAttribute("data-q-init", "true");
  });
}

function addToCartLogic(item) {
  const existing = cart.find(
    (i) => i.title === item.title && i.variant === item.variant,
  );
  existing ? existing.quantity++ : cart.push(item);
  saveAndRenderCart();
}

modalAddBtn?.addEventListener("click", function () {
  const activeColor =
    modal.querySelector(".color-btn.active")?.getAttribute("aria-label") ||
    "Ivory";
  const activeSize =
    modal.querySelector(".size-btn.active")?.textContent || "S";
  const item = {
    title: document.getElementById("modal-title").textContent,
    price: parseInt(
      document
        .getElementById("modal-price")
        .textContent.replace("€", "")
        .trim(),
    ),
    img: document.getElementById("modal-img").src,
    variant: `${activeColor} / ${activeSize}`,
    quantity: 1,
  };
  addToCartLogic(item);
  this.textContent = "Added ✓";
  setTimeout(() => (this.textContent = "Add to Cart"), 2000);
  toggleCart(null, true);
});

// ─── 7. UI УПРАВЛЕНИЕ (DRAWER & OVERLAYS) ────────────────────────────────────
function toggleCart(e, forceOpen = false) {
  if (e) e.preventDefault();
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer || !overlay) return;

  if (!drawer.classList.contains("active") || forceOpen) {
    drawer.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

document
  .querySelectorAll('button[aria-label="Cart"]')
  .forEach((btn) => btn.addEventListener("click", toggleCart));
document.getElementById("cart-close")?.addEventListener("click", toggleCart);
document.getElementById("cart-overlay")?.addEventListener("click", toggleCart);

// Size Guide Logic
document
  .querySelector(".size-guide-btn")
  ?.addEventListener("click", () =>
    document.getElementById("size-guide-overlay")?.classList.add("active"),
  );
document
  .getElementById("size-guide-close")
  ?.addEventListener("click", () =>
    document.getElementById("size-guide-overlay")?.classList.remove("active"),
  );

// ─── 8. CHECKOUT & SUCCESS ───────────────────────────────────────────────────
const checkoutForm = document.getElementById("checkout-form");
checkoutForm?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  btn.innerText = "Sending...";
  btn.style.pointerEvents = "none";
  try {
    const response = await fetch(this.action, {
      method: "POST",
      body: new FormData(this),
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      localStorage.removeItem("lune-cart");
      window.location.href = "success.html";
    }
  } catch (err) {
    btn.innerText = "Error. Try again";
    btn.style.pointerEvents = "all";
  }
});

if (window.location.href.includes("success.html")) {
  localStorage.removeItem("lune-cart");
  setTimeout(() => {
    const toast = document.createElement("div");
    toast.className = "email-toast";
    toast.innerText = "Confirmation Email Sent ✓";
    document.body.appendChild(toast);
  }, 1000);
}

// ─── INIT WISHLIST BUTTONS (TOGGLE AND COUNT) ───────────────────────────────────────
function initWishlistButtons() {
  document.querySelectorAll(".wish-btn").forEach((btn) => {
    if (btn.getAttribute("data-wish-init")) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleWishlist(id);
    });

    btn.setAttribute("data-wish-init", "true");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  renderCart();

  initModals();
  initQuickAdd();

  updateWishlistUI();
  initWishlistButtons();
});

// ─── GSAP ANIMATIONS ──────────────────────────────────────────
if (typeof gsap !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // 1. Эффект маски для заголовков (Главная фишка)
  const titles = document.querySelectorAll("h1, h2:not(.quote-title)");
  titles.forEach((title) => {
    const text = title.innerHTML;
    if (!title.querySelector(".reveal-wrapper")) {
      title.innerHTML = `<span class="reveal-wrapper" style="overflow:hidden; display:block;">
                           <span class="reveal-content" style="display:block;">${text}</span>
                         </span>`;
    }

    gsap.from(title.querySelector(".reveal-content"), {
      y: "110%",
      skewY: 7,
      duration: 1.8,
      ease: "expo.out",
      scrollTrigger: {
        trigger: title,
        start: "top 95%",
      },
    });
  });

  // 2. Фокусировка подзаголовков
  gsap.utils.toArray(".subtitle").forEach((sub) => {
    gsap.from(sub, {
      scrollTrigger: { trigger: sub, start: "top 95%" },
      opacity: 0,
      letterSpacing: "0.5em",
      duration: 2,
      ease: "power3.out",
    });
  });

  // 3. Смена цвета фона (Умная адаптация)
  ScrollTrigger.create({
    trigger: ".materials-section",
    start: "top 50%",
    end: "bottom 50%",
    immediateRender: false,
    onEnter: () => {
      gsap.to("body", { backgroundColor: "#f4f1ea", duration: 1.5 });
    },
    onLeaveBack: () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const heroBg = currentTheme === "dark" ? "#0a0a0f" : "#f5f2ea";
      gsap.to("body", { backgroundColor: heroBg, duration: 1.5 });
    },
    onLeave: () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const exitBg = currentTheme === "dark" ? "#0a0a0f" : "#f5f2ea";
      gsap.to("body", { backgroundColor: exitBg, duration: 1.5 });
    },
  });

  // 4. Карточки — эффект "Резинового" масштаба (Oryzo Style)
  gsap.utils
    .toArray(".phil-item, .material-card, .trace-item")
    .forEach((card) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        scale: 0.8,
        opacity: 0,
        y: 50,
        rotationX: 10,
        duration: 1.8,
        ease: "expo.out",
      });

      const img = card.querySelector("img");
      if (img) {
        gsap.from(img, {
          scale: 1.3,
          duration: 2.5,
          ease: "expo.out",
          scrollTrigger: { trigger: card, start: "top 90%" },
        });
      }
    });

  // 5. Цитата — Появление + Параллакс (Объединенная логика)
  const quote = document.querySelector(".quote-title");
  if (quote) {
    gsap.fromTo(
      quote,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: ".quote-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      },
    );
  }

  // 6. Параллакс фона Hero
  const aboutBg = document.querySelector(".about-hero-bg");
  if (aboutBg) {
    gsap.to(aboutBg, {
      y: "20%",
      ease: "none",
      scrollTrigger: {
        trigger: ".about-hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

// ─── ANIMATION FOR HERO MOON ────────────────────────────────────────────────
const heroMoon = document.querySelectorAll(".hero-moon img");

if (heroMoon.length > 0) {
  heroMoon.forEach((img) => {
    // 1. Бесконечное вращение (заменяет CSS animation)
    gsap.to(img, {
      rotation: 360,
      duration: 25,
      ease: "none",
      repeat: -1,
    });

    // 2. Эффект мягкого «дыхания» (пульсация яркости и масштаба)
    gsap.to(img, {
      scale: 1.03,
      filter: "brightness(1.1) contrast(1.05)",
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  });
}

// 3. Параллакс при скролле (чтобы луна слегка смещалась при движении)
const moonContainer = document.querySelector(".hero-moon");
if (moonContainer) {
  gsap.to(moonContainer, {
    y: 30,
    ease: "none",
    scrollTrigger: {
      trigger: ".about-hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

gsap.to(".hero-moon", {
  y: "-=8",
  duration: 3,
  yoyo: true,
  repeat: -1,
  ease: "sine.inOut",
});

gsap.to(".hero-content-wrapper", {
  y: "-=5",
  duration: 4,
  yoyo: true,
  repeat: -1,
  ease: "sine.inOut",
  delay: 0.5,
});

// 10 — ПОПАП РАССЫЛКИ С ЛОГИКОЙ ЗАПОМИНАНИЯ ВЫБОРА ПОЛЬЗОВАТЕЛЯ
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("newsletter-popup");
  const closeBtn = document.getElementById("newsletter-close");

  const hasSeenPopup = localStorage.getItem("lune-newsletter-seen");

  if (!hasSeenPopup) {
    setTimeout(() => {
      popup.classList.add("active");
      document.body.style.overflow = "hidden";
    }, 5000);
  }

  const closePopup = () => {
    popup.classList.remove("active");
    document.body.style.overflow = "";
    localStorage.setItem("lune-newsletter-seen", "true");
  };

  closeBtn?.addEventListener("click", closePopup);
  popup?.addEventListener("click", (e) => e.target === popup && closePopup());
});

// 11 — ПОПАП ПОИСКА С ЛОГИКОЙ ЗАКРЫТИЯ И АВТОФОКУСОМ НА ПОЛЕ ВВОДА
const searchOpen = document.querySelector('button[aria-label="Search"]');
const searchClose = document.getElementById("search-close");
const searchOverlay = document.getElementById("search-overlay");
const searchInput = document.getElementById("search-input");

function toggleSearch(forceClose = false) {
  if (forceClose || searchOverlay.classList.contains("active")) {
    searchOverlay.classList.remove("active");
    document.body.style.overflow = "";
  } else {
    searchOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    setTimeout(() => searchInput.focus(), 500);
  }
}

searchOpen?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleSearch();
});

searchInput?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const resultsContainer = document.getElementById("search-results");

  if (query.length < 2) {
    resultsContainer.innerHTML = "";
    return;
  }

  const matches = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query),
  );

  resultsContainer.innerHTML = matches
    .map(
      (p) => `
      <a href="catalog.html#${p.id}" 
         class="search-result-item" 
         onclick="toggleSearch(true)"
         style="display: block; margin: 15px 0; font-size: 1.2rem; text-decoration: none; color: inherit; transition: opacity 0.3s;">
          ${p.name} — €${p.price}
      </a>
    `,
    )
    .join("");
});

searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const firstResult = document.querySelector(".search-result-item");
    if (firstResult) {
      const targetHref = firstResult.getAttribute("href");
      toggleSearch(true);
      window.location.href = targetHref;

      if (window.location.pathname.includes("catalog.html")) {
        applyUrlFilter();
      }
    }
  }
});

searchClose?.addEventListener("click", () => toggleSearch(true));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleSearch(true);
});

// 12 — ГЛОБАЛЬНЫЙ КУРСОР С ГЛОУ ЭФФЕКТОМ
const createGlow = () => {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);

  window.addEventListener("mousemove", (e) => {
    gsap.to(glow, {
      x: e.clientX,
      y: e.clientY,
      duration: 1.2,
      ease: "power2.out",
    });
  });

  document.addEventListener("mouseleave", () => {
    gsap.to(glow, { opacity: 0, duration: 0.5 });
  });

  document.addEventListener("mouseenter", () => {
    gsap.to(glow, { opacity: 1, duration: 0.5 });
  });
};

createGlow();

// 13 — МАГНИТНЫЙ ЭФФЕКТ ДЛЯ КНОПОК
const magneticElements = document.querySelectorAll(
  ".icon-btn, .btn-primary, .theme-toggle, .header-logo",
);

magneticElements.forEach((el) => {
  el.addEventListener("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    this.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
  });

  el.addEventListener("mouseleave", function () {
    this.style.transform = `translate(0px, 0px)`;
  });
});

// 14 — PRELOADER ANIMATION
window.addEventListener("load", () => {
  const preloader = document.querySelector(".preloader");
  const logos = document.querySelectorAll(".preloader-logo");

  if (!preloader) return;

  if (typeof gsap === "undefined") {
    preloader.remove();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => preloader.remove(),
  });

  tl.to(logos, {
    opacity: 1,
    scale: 1,
    duration: 0.9,
    ease: "power3.out",
  })
    .to(logos, {
      opacity: 0,
      duration: 0.5,
      delay: 0.5,
      ease: "power2.out",
    })
    .to(preloader, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });
});

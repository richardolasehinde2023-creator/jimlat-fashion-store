// ============================================
// APP CONTROLLER
// The main brain — starts and connects
// everything together
// ============================================

const App = {

  // ── STARTUP ──────────────────────────────

  async init() {
  await ProductManager.loadProducts();
  Cart.init();
  this.initHeader();
  this.initCartSidebar();

  // Initialize Firebase Auth
  AuthManager.init();

  var page = this.detectPage();
  switch (page) {
    case 'home':
      this.initHomePage();
      break;
    case 'products':
      this.initProductsPage();
      break;
    case 'product-detail':
      this.initProductDetailPage();
      break;
    case 'cart':
      this.initCartPage();
      break;
    case 'checkout':
      this.initCheckoutPage();
      break;
    case 'order-confirmation':
      this.initOrderConfirmationPage();
      break;
    case 'wishlist':
      this.initWishlistPage();
      break;
    case 'tracking':
      this.initTrackingPage();
      break;
    case 'contact':
      this.initContactPage();
      break;
    case 'faq':
      this.initFaqPage();
      break;
  }
},

  // ── PAGE DETECTION ───────────────────────

  detectPage() {
    // Gets the current URL path
    // Example: '/store/cart.html'
    const path = window.location.pathname;

    // Check path for page name keywords
    // includes() returns true if string contains the word
    if (path.includes('product-detail'))     return 'product-detail';
    if (path.includes('products'))           return 'products';
    if (path.includes('cart'))               return 'cart';
    if (path.includes('checkout'))           return 'checkout';
    if (path.includes('order-confirmation')) return 'order-confirmation';
    if (path.includes('wishlist'))           return 'wishlist';
    if (path.includes('tracking'))           return 'tracking';
    if (path.includes('about'))             return 'about';
    if (path.includes('contact'))           return 'contact';
    if (path.includes('faq'))               return 'faq';

    // If none matched, we're on the homepage
    return 'home';
  },

  // ── HEADER ───────────────────────────────
  // Runs on every page

  initHeader() {
    this.initMobileMenu();
    this.initSearch();
    this.initScrollBehavior();
    this.highlightActiveNavLink();
  },

  initMobileMenu() {
    const toggle  = document.getElementById('mobileMenuToggle');
    const nav     = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');

    if (!toggle || !nav) return;

    // Open/close menu when hamburger clicked
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      isOpen ? this.closeMenu() : this.openMenu();
    });

    // Close menu when overlay (dark background) clicked
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeMenu();
        this.closeCartSidebar();
      });
    }

    // Close menu if screen is resized to desktop size
    // (prevents ghost open menu if user resizes window)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeMenu();
      }
    });
  },

  openMenu() {
    const nav     = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    const toggle  = document.getElementById('mobileMenuToggle');

    nav.classList.add('open');
    overlay.classList.add('active');
    toggle.classList.add('active');

    // Prevent page scrolling when menu is open
    document.body.style.overflow = 'hidden';
  },

  closeMenu() {
    const nav     = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    const toggle  = document.getElementById('mobileMenuToggle');

    if (!nav) return;

    nav.classList.remove('open');
    overlay.classList.remove('active');
    toggle.classList.remove('active');

    // Restore page scrolling
    document.body.style.overflow = '';
  },

  initSearch() {
    const searchToggle  = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose   = document.getElementById('searchClose');
    const searchInput   = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchForm    = document.getElementById('searchForm');

    // Not all pages have search — exit if elements don't exist
    if (!searchToggle) return;

    // Open search overlay
    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      // Focus input so user can type immediately
      searchInput.focus();
    });

    // Close search overlay
    searchClose.addEventListener('click', () => {
      this.closeSearch();
    });

    // Close search with Escape key
    // This is good UX — users expect Escape to close things
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSearch();
        this.closeMenu();
      }
    });

    // Live search as user types
    // debounce prevents searching on every single keystroke
    // waits until user pauses typing for 300ms
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          // Only search if at least 2 characters typed
          const results = ProductManager.search(query);
          this.renderSearchResults(results, searchResults);
        } else {
          searchResults.innerHTML = '';
        }
      }, 300);
    });

    // When form submitted go to products page with search query
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
      }
    });
  },

  closeSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput   = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchOverlay) return;

    searchOverlay.classList.remove('active');
    searchInput.value   = '';
    searchResults.innerHTML = '';
  },

  renderSearchResults(products, container) {
    if (products.length === 0) {
      container.innerHTML = `
        <p class="search-no-results">No products found</p>
      `;
      return;
    }

    // Show max 5 results in the dropdown
    // clicking "see all" goes to full results page
    container.innerHTML = `
      ${products.slice(0, 5).map(product => `
        <a href="product-detail.html?id=${product.id}" class="search-result-item">
          <img src="${product.images[0]}" alt="${product.name}">
          <div class="search-result-info">
            <span class="search-result-name">${product.name}</span>
            <span class="search-result-price">
              ${ProductManager.formatPrice(ProductManager.getPrice(product))}
            </span>
          </div>
        </a>
      `).join('')}
      ${products.length > 5 ? `
        <a href="products.html?search=${encodeURIComponent(document.getElementById('searchInput').value)}"
           class="search-see-all">
          See all ${products.length} results →
        </a>
      ` : ''}
    `;
  },

  initScrollBehavior() {
    const header = document.getElementById('header');
    if (!header) return;

    // Add shadow to header when page is scrolled
    // Gives depth — header feels separate from content
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
      // Show button only after scrolling down 400px
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    backToTop.addEventListener('click', () => {
      // Smooth scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  highlightActiveNavLink() {
    // Gets current page filename
    // Example: 'products.html'
    const currentPage = window.location.pathname.split('/').pop();

    document.querySelectorAll('.nav-link').forEach(link => {
      // Gets the link's href filename
      const linkPage = link.getAttribute('href');

      if (linkPage === currentPage) {
        link.classList.add('active');
      }
    });
  },

  // ── CART SIDEBAR ─────────────────────────
  // Slides in from the right on every page

  initCartSidebar() {
    const cartToggle  = document.getElementById('cartToggle');
    const cartClose   = document.getElementById('cartSidebarClose');

    if (!cartToggle) return;

    // Open sidebar when cart icon clicked
    cartToggle.addEventListener('click', () => {
      this.openCartSidebar();
    });

    // Close sidebar when X clicked
    if (cartClose) {
      cartClose.addEventListener('click', () => {
        this.closeCartSidebar();
      });
    }

    // Re-render sidebar whenever cart changes
    // This keeps the sidebar always up to date
    Cart.onChange(() => {
      this.renderCartSidebar();
    });

    // Render sidebar on first load
    // in case they had items from before
    this.renderCartSidebar();
  },

  openCartSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeCartSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');

    if (!sidebar) return;

    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderCartSidebar() {
    const body    = document.getElementById('cartSidebarBody');
    const footer  = document.getElementById('cartSidebarFooter');

    if (!body) return;

    const items   = Cart.getItems();
    const summary = Cart.getSummary();

    // Update cart count in header
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = summary.itemCount;
    });

    // Empty cart state
    if (Cart.isEmpty()) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started</p>
          <a href="products.html" class="btn btn-primary">
            Browse Products
          </a>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    // Show footer when cart has items
    if (footer) footer.style.display = 'flex';

    // Render each cart item
    body.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.productId}">

        <a href="product-detail.html?id=${item.productId}"
           class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </a>

        <div class="cart-item-details">
          <a href="product-detail.html?id=${item.productId}"
             class="cart-item-name">
            ${item.name}
          </a>

          ${item.variant ? `
            <p class="cart-item-variant">
              ${Object.values(item.variant).join(' · ')}
            </p>
          ` : ''}

          <p class="cart-item-price">
            ${Cart.formatPrice(item.price)}
          </p>

          <div class="quantity-control">
            <button class="quantity-btn"
              onclick="App.changeQuantity('${item.productId}', ${item.quantity - 1})">
              −
            </button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn"
              onclick="App.changeQuantity('${item.productId}', ${item.quantity + 1})">
              +
            </button>
          </div>
        </div>

        <div class="cart-item-right">
          <button class="cart-item-remove"
            onclick="App.removeCartItem('${item.productId}')"
            aria-label="Remove item">
            ×
          </button>
          <p class="cart-item-total">
            ${Cart.formatPrice(item.price * item.quantity)}
          </p>
        </div>

      </div>
    `).join('');

    // Update summary in footer
    const subtotalEl = document.getElementById('cartSubtotal');
    const savingsEl  = document.getElementById('cartSavings');
    const savingsRow = document.getElementById('cartSavingsRow');

    if (subtotalEl) subtotalEl.textContent = Cart.formatPrice(summary.subtotal);

    // Only show savings row if they actually saved something
    if (savingsRow && savingsEl) {
      if (summary.savings > 0) {
        savingsRow.style.display = 'flex';
        savingsEl.textContent = `− ${Cart.formatPrice(summary.savings)}`;
      } else {
        savingsRow.style.display = 'none';
      }
    }
  },

  // Called by the + and - buttons in the cart
  // Has to be on App object so onclick="" can find it
  changeQuantity(productId, newQuantity) {
    Cart.updateQuantity(productId, newQuantity);
  },

  removeCartItem(productId) {
    Cart.removeItem(productId);
  },

  // ── ADD TO CART ──────────────────────────
  // Called from product cards and detail page

  addToCart(productId, quantity = 1, variant = null) {
    const product = ProductManager.getById(productId);
    if (!product) return;

    const added = Cart.addItem(product, quantity, variant);

    // Open the sidebar so they can see it was added
    if (added) {
      this.openCartSidebar();
    }
  },

  // ── WISHLIST ─────────────────────────────
  isInWishlist(productId) {
  return StorageManager.getWishlist().includes(productId);
  },
  async toggleWishlist(productId) {
  var wishlist = StorageManager.getWishlist();
  var index    = wishlist.indexOf(productId);

  if (index > -1) {
    wishlist.splice(index, 1);
    Cart.showNotification('Removed from wishlist', 'info');
  } else {
    wishlist.push(productId);
    Cart.showNotification('Added to wishlist!', 'success');
  }

  // Save locally always
  StorageManager.saveWishlist(wishlist);

  // Save to Firestore if logged in
  if (AuthManager.isLoggedIn()) {
    await FirestoreManager.saveWishlist(
      AuthManager.getUserId(),
      wishlist
    );
  }

  this.updateWishlistUI(productId);
  this.updateWishlistBadge();
},

  updateWishlistUI(productId) {
    // Update all wishlist heart buttons for this product
    // (could appear multiple times on page)
    document.querySelectorAll(`[data-wishlist="${productId}"]`).forEach(btn => {
      btn.classList.toggle('active', this.isInWishlist(productId));
    });
  },

  updateWishlistBadge() {
    const count = StorageManager.getWishlist().length;
    document.querySelectorAll('.wishlist-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  // ── PAGE INITIALISERS ─────────────────────
  // These get filled out when we build each page
  // For now they're empty placeholders

  initHomePage() {
  this.initHeroSlider();
  this.renderCategories();
  this.renderFeaturedProducts();
  this.renderNewArrivals();
  this.initNewsletter();
},

initHeroSlider() {
  const slides        = document.querySelectorAll('.hero-slide');
  const dotsContainer  = document.getElementById('heroDots');
  const prevBtn        = document.getElementById('heroPrev');
  const nextBtn        = document.getElementById('heroNext');

  if (!slides.length) return;

  let current  = 0;
  let autoPlay = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

  function startAuto() { autoPlay = setInterval(next, 5000); }
  function resetAuto() { clearInterval(autoPlay); startAuto(); }
  startAuto();

  let touchStartX = 0;
  const slider = document.getElementById('heroSlider');

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });

  slider.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      resetAuto();
    }
  });
},

renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  const categories = ProductManager.categories;

  if (!categories.length) {
    grid.innerHTML = '<p class="no-products">No categories yet</p>';
    return;
  }

  grid.innerHTML = categories.map(cat => {
    const count = ProductManager.getByCategory(cat.id).length;
    return `
      <a href="products.html?category=${cat.id}" class="category-card">
        <img src="${cat.image}" alt="${cat.name}" loading="lazy">
        <div class="category-card-overlay">
          <h3>${cat.name}</h3>
          <span>${count} Product${count !== 1 ? 's' : ''}</span>
        </div>
      </a>
    `;
  }).join('');
},

renderFeaturedProducts() {
  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  const products = ProductManager.getFeatured().slice(0, 8);
  grid.innerHTML = products.length
    ? products.map(p => this.createProductCard(p)).join('')
    : '<p class="no-products">No featured products yet</p>';
},

renderNewArrivals() {
  const grid = document.getElementById('newArrivals');
  if (!grid) return;

  const products = ProductManager.getNewArrivals(8);
  grid.innerHTML = products.length
    ? products.map(p => this.createProductCard(p)).join('')
    : '<p class="no-products">No new arrivals yet</p>';
},

createProductCard(product) {
  const price      = ProductManager.getPrice(product);
  const isNew      = ProductManager.isNew(product.dateAdded);
  const inWishlist = this.isInWishlist(product.id);
  const discount   = product.onSale
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return `
    <div class="product-card" data-product-id="${product.id}">

      <div class="product-card-image">
        <a href="product-detail.html?id=${product.id}">
          <img src="${product.images[0]}"
               alt="${product.name}"
               loading="lazy">
        </a>

        <div class="product-badges">
          ${product.onSale
            ? `<span class="product-badge badge-sale">-${discount}%</span>`
            : ''}
          ${isNew && !product.onSale
            ? `<span class="product-badge badge-new">New</span>`
            : ''}
          ${product.featured && !product.onSale && !isNew
            ? `<span class="product-badge badge-featured">Featured</span>`
            : ''}
        </div>

        <div class="product-card-actions">
          <button class="product-action-btn ${inWishlist ? 'active' : ''}"
                  data-wishlist="${product.id}"
                  onclick="App.toggleWishlist('${product.id}')"
                  aria-label="Wishlist">
            ${inWishlist ? '♥' : '♡'}
          </button>
          <button class="product-action-btn"
                  onclick="App.openQuickView('${product.id}')"
                  aria-label="Quick view">
            👁
          </button>
        </div>
      </div>

      <div class="product-card-body">
        <p class="product-card-category">${product.category}</p>
        <h3 class="product-card-title">
          <a href="product-detail.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-rating">
          <span class="stars">${this.getStarsHTML(product.rating)}</span>
          <span class="rating-count">(${product.reviewCount})</span>
        </div>
        <div class="product-card-price">
          <span class="price-current">${ProductManager.formatPrice(price)}</span>
          ${product.onSale ? `
            <span class="price-original">${ProductManager.formatPrice(product.price)}</span>
            <span class="price-discount">-${discount}%</span>
          ` : ''}
        </div>
      </div>

      <div class="product-card-footer">
        ${product.stock > 0 ? `
          <button class="add-to-cart-btn"
                  onclick="App.addToCart('${product.id}')">
            Add to Cart
          </button>
        ` : `
          <button class="add-to-cart-btn" disabled>
            Out of Stock
          </button>
        `}
      </div>

    </div>
  `;
},

openQuickView(productId) {
  const product = ProductManager.getById(productId);
  if (!product) return;

  const price    = ProductManager.getPrice(product);
  const discount = product.onSale
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  const existing = document.getElementById('quickViewModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id        = 'quickViewModal';
  modal.className = 'quick-view-modal';
  modal.innerHTML = `
    <div class="quick-view-overlay" onclick="App.closeQuickView()"></div>
    <div class="quick-view-content">
      <button class="quick-view-close" onclick="App.closeQuickView()" aria-label="Close">×</button>
      <div class="quick-view-grid">
        <div class="quick-view-image">
          <img src="${product.images[0]}" alt="${product.name}">
        </div>
        <div class="quick-view-info">
          <p class="product-card-category">${product.category}</p>
          <h2>${product.name}</h2>
          <div class="product-rating">
            <span class="stars">${this.getStarsHTML(product.rating)}</span>
            <span class="rating-count">(${product.reviewCount} reviews)</span>
          </div>
          <div class="product-card-price" style="margin: var(--space-4) 0">
            <span class="price-current" style="font-size: var(--font-size-2xl)">
              ${ProductManager.formatPrice(price)}
            </span>
            ${product.onSale ? `
              <span class="price-original">${ProductManager.formatPrice(product.price)}</span>
              <span class="price-discount">-${discount}%</span>
            ` : ''}
          </div>
          <p style="font-size:var(--font-size-sm);color:var(--gray-600);line-height:1.7;margin-bottom:var(--space-4)">
            ${product.shortDescription || product.description}
          </p>
          <p style="font-size:var(--font-size-sm);margin-bottom:var(--space-6);color:${product.stock > 5 ? 'var(--success)' : product.stock > 0 ? 'var(--warning)' : 'var(--error)'}">
            ${product.stock > 5 ? '✓ In Stock' : product.stock > 0 ? '⚠ Only ' + product.stock + ' left' : '✕ Out of Stock'}
          </p>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${product.stock > 0 ? `
              <button class="btn btn-primary btn-block btn-lg"
                      onclick="App.addToCart('${product.id}'); App.closeQuickView()">
                Add to Cart
              </button>
            ` : `
              <button class="btn btn-primary btn-block btn-lg" disabled>Out of Stock</button>
            `}
            <a href="product-detail.html?id=${product.id}" class="btn btn-outline btn-block">
              View Full Details
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  });
  document.body.style.overflow = 'hidden';
},

closeQuickView() {
  const modal = document.getElementById('quickViewModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => modal.remove(), 300);
},

initNewsletter() {
  var form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var input = form.querySelector('input[type="email"]');
    var email = input.value.trim();
    if (!email) return;

    // Save locally
    var subscribers = StorageManager.get('store_subscribers') || [];

    if (subscribers.includes(email)) {
      Cart.showNotification('You are already subscribed!', 'info');
      return;
    }

    subscribers.push(email);
    StorageManager.set('store_subscribers', subscribers);

    // Save to Firestore
    await FirestoreManager.saveSubscriber(email);

    Cart.showNotification('Thanks for subscribing! 🎉', 'success');
    form.reset();
  });
},

initProductsPage() {
  // Our active filters object
  // Holds the current state of all filters
  this.filters = {
    category:    'all',
    subcategory: 'all',
    search:      '',
    minPrice:    undefined,
    maxPrice:    undefined,
    onSaleOnly:  false,
    inStockOnly: true,
    sort:        'newest'
  };

  this.readUrlFilters();
  this.buildCategoryFilters();
  this.bindFilterEvents();
  this.applyFilters();
},

readUrlFilters() {
  // Read any filters passed through the URL
  // Example: products.html?category=tops
  // Example: products.html?filter=sale
  // Example: products.html?search=sneakers
  const category = this.getUrlParam('category');
  const search   = this.getUrlParam('search');
  const filter   = this.getUrlParam('filter');

  if (category) this.filters.category = category;
  if (search)   this.filters.search   = search;

  if (filter === 'sale')     this.filters.onSaleOnly = true;
  if (filter === 'new')      this.filters.sort       = 'newest';

  // Pre-fill search input if search was in URL
  if (search) {
    const input = document.getElementById('filterSearch');
    if (input) input.value = search;
  }

  this.updatePageTitle();
},

updatePageTitle() {
  const title      = document.getElementById('pageTitle');
  const breadcrumb = document.getElementById('breadcrumbCurrent');
  if (!title || !breadcrumb) return;

  const filter = this.getUrlParam('filter');

  if (this.filters.search) {
    title.textContent      = `Results for "${this.filters.search}"`;
    breadcrumb.textContent = 'Search';
  } else if (this.filters.category !== 'all') {
    const cat = ProductManager.categories.find(
      c => c.id === this.filters.category
    );
    if (cat) {
      title.textContent      = cat.name;
      breadcrumb.textContent = cat.name;
    }
  } else if (filter === 'sale') {
    title.textContent      = 'On Sale';
    breadcrumb.textContent = 'On Sale';
  } else if (filter === 'new') {
    title.textContent      = 'New Arrivals';
    breadcrumb.textContent = 'New Arrivals';
  } else if (filter === 'featured') {
    title.textContent      = 'Featured Products';
    breadcrumb.textContent = 'Featured';
  }
},

buildCategoryFilters() {
  const list = document.getElementById('categoryFilter');
  if (!list) return;

  const categories = ProductManager.categories;
  const allCount   = ProductManager.getAll().length;

  let html = `
    <li>
      <button class="filter-option ${this.filters.category === 'all' ? 'active' : ''}"
              data-category="all">
        All
        <span class="filter-option-count">${allCount}</span>
      </button>
    </li>
  `;

  categories.forEach(cat => {
    const count = ProductManager.getByCategory(cat.id).length;
    html += `
      <li>
        <button class="filter-option ${this.filters.category === cat.id ? 'active' : ''}"
                data-category="${cat.id}">
          ${cat.name}
          <span class="filter-option-count">${count}</span>
        </button>
      </li>
    `;
  });

  list.innerHTML = html;
},

buildSubcategoryFilters(category) {
  const group = document.getElementById('subcategoryGroup');
  const list  = document.getElementById('subcategoryFilter');
  if (!group || !list) return;

  if (category === 'all') {
    group.style.display = 'none';
    return;
  }

  const products = ProductManager.getByCategory(category);

  // Get unique subcategories from products in this category
  const subcategories = [...new Set(
    products
      .map(p => p.subcategory)
      .filter(s => s && s.length > 0)
  )];

  // Don't show subcategories if there's only one or none
  if (subcategories.length <= 1) {
    group.style.display = 'none';
    return;
  }

  group.style.display = 'flex';

  let html = `
    <li>
      <button class="filter-option active"
              data-subcategory="all">
        All
      </button>
    </li>
  `;

  subcategories.forEach(sub => {
    const count = products.filter(p => p.subcategory === sub).length;
    html += `
      <li>
        <button class="filter-option"
                data-subcategory="${sub}">
          ${sub}
          <span class="filter-option-count">${count}</span>
        </button>
      </li>
    `;
  });

  list.innerHTML = html;

  // Bind subcategory click events
  list.querySelectorAll('[data-subcategory]').forEach(btn => {
    btn.addEventListener('click', () => {
      list.querySelectorAll('.filter-option')
          .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.filters.subcategory = btn.dataset.subcategory;
      this.applyFilters();
    });
  });
},

bindFilterEvents() {
  const categoryList  = document.getElementById('categoryFilter');
  const searchInput   = document.getElementById('filterSearch');
  const sortSelect    = document.getElementById('sortSelect');
  const saleFilter    = document.getElementById('saleFilter');
  const stockFilter   = document.getElementById('stockFilter');
  const priceApply    = document.getElementById('priceApply');
  const clearBtn      = document.getElementById('clearFilters');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const filterToggle  = document.getElementById('filterToggleBtn');
  const filtersClose  = document.getElementById('filtersClose');
  const sidebar       = document.getElementById('filtersSidebar');
  const overlay       = document.getElementById('overlay');

  // Category filter clicks
  categoryList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;

    categoryList.querySelectorAll('.filter-option')
                .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.filters.category    = btn.dataset.category;
    this.filters.subcategory = 'all';

    this.buildSubcategoryFilters(this.filters.category);
    this.applyFilters();
  });

  // Live search with debounce
  // Waits 300ms after user stops typing
  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      this.filters.search = e.target.value.trim();
      this.applyFilters();
    }, 300);
  });

  // Sort change
  sortSelect.value = this.filters.sort;
  sortSelect.addEventListener('change', (e) => {
    this.filters.sort = e.target.value;
    this.applyFilters();
  });

  // Sale toggle
  saleFilter.checked = this.filters.onSaleOnly;
  saleFilter.addEventListener('change', (e) => {
    this.filters.onSaleOnly = e.target.checked;
    this.applyFilters();
  });

  // Stock toggle
  stockFilter.checked = this.filters.inStockOnly;
  stockFilter.addEventListener('change', (e) => {
    this.filters.inStockOnly = e.target.checked;
    this.applyFilters();
  });

  // Price apply button
  priceApply.addEventListener('click', () => {
    const min = document.getElementById('priceMin').value;
    const max = document.getElementById('priceMax').value;
    this.filters.minPrice = min ? parseFloat(min) : undefined;
    this.filters.maxPrice = max ? parseFloat(max) : undefined;
    this.applyFilters();
  });

  // Clear all filters
  clearBtn.addEventListener('click', () => { this.resetFilters(); });
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => { this.resetFilters(); });
  }

  // Grid / List view toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn')
              .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const grid = document.getElementById('productsGrid');
      if (btn.dataset.view === 'list') {
        grid.classList.add('list-view');
      } else {
        grid.classList.remove('list-view');
      }
    });
  });

  // Mobile: open filters sidebar
  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Mobile: close filters sidebar
  if (filtersClose) {
    filtersClose.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
},

applyFilters() {
  let results = ProductManager.getAll();

  // Special URL filter for featured
  const urlFilter = this.getUrlParam('filter');
  if (urlFilter === 'featured') {
    results = results.filter(p => p.featured === true);
  }

  // Search filter
  if (this.filters.search) {
    const q = this.filters.search.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q)        ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)    ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (this.filters.category !== 'all') {
    results = results.filter(p => p.category === this.filters.category);
  }

  // Subcategory filter
  if (this.filters.subcategory !== 'all') {
    results = results.filter(p => p.subcategory === this.filters.subcategory);
  }

  // Price filters
  if (this.filters.minPrice !== undefined) {
    results = results.filter(p =>
      ProductManager.getPrice(p) >= this.filters.minPrice
    );
  }

  if (this.filters.maxPrice !== undefined) {
    results = results.filter(p =>
      ProductManager.getPrice(p) <= this.filters.maxPrice
    );
  }

  // Sale filter
  if (this.filters.onSaleOnly) {
    results = results.filter(p => p.onSale === true);
  }

  // Stock filter
  if (this.filters.inStockOnly) {
    results = results.filter(p => p.stock > 0);
  }

  // Sorting
  switch (this.filters.sort) {
    case 'price-low':
      results.sort((a, b) =>
        ProductManager.getPrice(a) - ProductManager.getPrice(b)
      );
      break;
    case 'price-high':
      results.sort((a, b) =>
        ProductManager.getPrice(b) - ProductManager.getPrice(a)
      );
      break;
    case 'name-az':
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-za':
      results.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
    default:
      results.sort((a, b) =>
        new Date(b.dateAdded) - new Date(a.dateAdded)
      );
      break;
  }

  this.renderProducts(results);
  this.renderActiveFilters();
  this.updateProductCount(results.length);
},

renderProducts(products) {
  const grid  = document.getElementById('productsGrid');
  const empty = document.getElementById('productsEmpty');
  if (!grid || !empty) return;

  if (products.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display  = 'grid';
  empty.style.display = 'none';
  grid.innerHTML = products.map(p => this.createProductCard(p)).join('');
},

renderActiveFilters() {
  const container = document.getElementById('activeFilters');
  if (!container) return;

  const tags = [];

  if (this.filters.category !== 'all') {
    const cat = ProductManager.categories.find(
      c => c.id === this.filters.category
    );
    if (cat) {
      tags.push(`
        <span class="filter-tag">
          ${cat.name}
          <button class="filter-tag-remove"
                  onclick="App.removeFilter('category')">×</button>
        </span>
      `);
    }
  }

  if (this.filters.subcategory !== 'all') {
    tags.push(`
      <span class="filter-tag">
        ${this.filters.subcategory}
        <button class="filter-tag-remove"
                onclick="App.removeFilter('subcategory')">×</button>
      </span>
    `);
  }

  if (this.filters.search) {
    tags.push(`
      <span class="filter-tag">
        "${this.filters.search}"
        <button class="filter-tag-remove"
                onclick="App.removeFilter('search')">×</button>
      </span>
    `);
  }

  if (this.filters.minPrice !== undefined ||
      this.filters.maxPrice !== undefined) {
    const min = this.filters.minPrice !== undefined
      ? ProductManager.formatPrice(this.filters.minPrice)
      : '₦0';
    const max = this.filters.maxPrice !== undefined
      ? ProductManager.formatPrice(this.filters.maxPrice)
      : '∞';
    tags.push(`
      <span class="filter-tag">
        ${min} — ${max}
        <button class="filter-tag-remove"
                onclick="App.removeFilter('price')">×</button>
      </span>
    `);
  }

  if (this.filters.onSaleOnly) {
    tags.push(`
      <span class="filter-tag">
        On Sale Only
        <button class="filter-tag-remove"
                onclick="App.removeFilter('sale')">×</button>
      </span>
    `);
  }

  container.innerHTML = tags.join('');
},

removeFilter(type) {
  switch (type) {
    case 'category':
      this.filters.category    = 'all';
      this.filters.subcategory = 'all';
      document.getElementById('subcategoryGroup').style.display = 'none';
      document.querySelectorAll('#categoryFilter .filter-option')
              .forEach(b => b.classList.remove('active'));
      document.querySelector('#categoryFilter [data-category="all"]')
              .classList.add('active');
      break;

    case 'subcategory':
      this.filters.subcategory = 'all';
      document.querySelectorAll('#subcategoryFilter .filter-option')
              .forEach(b => b.classList.remove('active'));
      const allSubBtn = document.querySelector(
        '#subcategoryFilter [data-subcategory="all"]'
      );
      if (allSubBtn) allSubBtn.classList.add('active');
      break;

    case 'search':
      this.filters.search = '';
      document.getElementById('filterSearch').value = '';
      break;

    case 'price':
      this.filters.minPrice = undefined;
      this.filters.maxPrice = undefined;
      document.getElementById('priceMin').value = '';
      document.getElementById('priceMax').value = '';
      break;

    case 'sale':
      this.filters.onSaleOnly = false;
      document.getElementById('saleFilter').checked = false;
      break;
  }

  this.applyFilters();
},

resetFilters() {
  this.filters = {
    category:    'all',
    subcategory: 'all',
    search:      '',
    minPrice:    undefined,
    maxPrice:    undefined,
    onSaleOnly:  false,
    inStockOnly: true,
    sort:        'newest'
  };

  document.getElementById('filterSearch').value  = '';
  document.getElementById('priceMin').value      = '';
  document.getElementById('priceMax').value      = '';
  document.getElementById('saleFilter').checked  = false;
  document.getElementById('stockFilter').checked = true;
  document.getElementById('sortSelect').value    = 'newest';
  document.getElementById('subcategoryGroup').style.display = 'none';

  document.querySelectorAll('#categoryFilter .filter-option')
          .forEach(b => b.classList.remove('active'));
  document.querySelector('#categoryFilter [data-category="all"]')
          .classList.add('active');

  const title      = document.getElementById('pageTitle');
  const breadcrumb = document.getElementById('breadcrumbCurrent');
  if (title)      title.textContent      = 'All Products';
  if (breadcrumb) breadcrumb.textContent = 'Shop';

  this.applyFilters();
},

updateProductCount(count) {
  const el = document.getElementById('productsCount');
  if (el) el.textContent = `${count} product${count !== 1 ? 's' : ''}`;
},

  initProductDetailPage() {
  // Get product ID from URL
  const productId = this.getUrlParam('id');

  if (!productId) {
    window.location.href = 'products.html';
    return;
  }

  const product = ProductManager.getById(productId);

  if (!product) {
    window.location.href = 'products.html';
    return;
  }

  // Track this product as recently viewed
  StorageManager.addRecentlyViewed(productId);

  // Build the page
  this.renderProductDetail(product);
  this.renderProductTabs(product);
  this.renderRelatedProducts(product);
  this.renderRecentlyViewed(productId);
  this.initProductTabs();
},

renderProductDetail(product) {
  const container  = document.getElementById('productDetail');
  const breadcrumb = document.getElementById('breadcrumbProduct');
  const tabs       = document.getElementById('productTabs');

  if (!container) return;

  // Update breadcrumb
  if (breadcrumb) breadcrumb.textContent = product.name;

  // Update page title
  document.title = `${product.name} — Store Name`;

  const price      = ProductManager.getPrice(product);
  const inWishlist = this.isInWishlist(product.id);
  const discount   = product.onSale
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  // Stock status
  let stockHTML = '';
  if (product.stock <= 0) {
    stockHTML = `<span class="stock-status stock-out">✕ Out of Stock</span>`;
  } else if (product.stock <= 5) {
    stockHTML = `<span class="stock-status stock-low">⚠ Only ${product.stock} left</span>`;
  } else {
    stockHTML = `<span class="stock-status stock-in">✓ In Stock</span>`;
  }

  // Color variants HTML
  let variantsHTML = '';
  if (product.variants && product.variants.length > 0) {
    variantsHTML = `
      <div class="product-detail-variants">
        <p class="variant-label">
          Color: <span id="selectedColor">${product.variants[0].color}</span>
        </p>
        <div class="color-options">
          ${product.variants.map((v, i) => `
            <button class="color-option ${i === 0 ? 'active' : ''}"
                    data-color="${v.color}"
                    data-stock="${v.stock}"
                    onclick="App.selectColor(this)">
              ${v.color}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Sizes HTML
  let sizesHTML = '';
  if (product.sizes && product.sizes.length > 0) {
    sizesHTML = `
      <div class="product-detail-sizes">
        <p class="size-label">
          Size: <span id="selectedSize">Select a size</span>
        </p>
        <div class="size-options">
          ${product.sizes.map(size => `
            <button class="size-option"
                    data-size="${size}"
                    onclick="App.selectSize(this)">
              ${size}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Gallery HTML
  const galleryHTML = `
    <div class="product-detail-gallery">
      <div class="gallery-main">
        <img src="${product.images[0]}"
             alt="${product.name}"
             class="gallery-main-img"
             id="galleryMainImg">
      </div>
      ${product.images.length > 1 ? `
        <div class="gallery-thumbs">
          ${product.images.map((img, i) => `
            <button class="gallery-thumb ${i === 0 ? 'active' : ''}"
                    onclick="App.switchImage('${img}', this)">
              <img src="${img}" alt="${product.name} view ${i + 1}">
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Info HTML
  const infoHTML = `
    <div class="product-detail-info">

      <p class="product-detail-category">${product.category} ${product.subcategory ? `· ${product.subcategory}` : ''}</p>

      <h1 class="product-detail-title">${product.name}</h1>

      <div class="product-detail-rating">
        <span class="stars">${this.getStarsHTML(product.rating)}</span>
        <span class="rating-count">(${product.reviewCount} reviews)</span>
      </div>

      <div class="product-detail-price">
        <span class="price-detail-current">
          ${ProductManager.formatPrice(price)}
        </span>
        ${product.onSale ? `
          <span class="price-detail-original">
            ${ProductManager.formatPrice(product.price)}
          </span>
          <span class="price-detail-savings">
            Save ${discount}%
          </span>
        ` : ''}
      </div>

      <p class="product-detail-description">
        ${product.description}
      </p>

      ${variantsHTML}
      ${sizesHTML}

      <div class="product-detail-quantity">
        <p class="quantity-label">Quantity</p>
        <div class="quantity-control-lg">
          <button class="quantity-btn-lg"
                  onclick="App.decreaseDetailQty()">−</button>
          <input type="number"
                 class="quantity-input-lg"
                 id="detailQuantity"
                 value="1"
                 min="1"
                 max="${product.stock}">
          <button class="quantity-btn-lg"
                  onclick="App.increaseDetailQty(${product.stock})">+</button>
        </div>
        ${stockHTML}
      </div>

      <div class="product-detail-actions">
        <div class="btn-row">
          ${product.stock > 0 ? `
            <button class="btn btn-primary btn-lg"
                    style="flex:1"
                    onclick="App.addToCartFromDetail('${product.id}')">
              Add to Cart
            </button>
          ` : `
            <button class="btn btn-primary btn-lg"
                    style="flex:1" disabled>
              Out of Stock
            </button>
          `}
          <button class="wishlist-btn ${inWishlist ? 'active' : ''}"
                  id="detailWishlistBtn"
                  onclick="App.toggleWishlistDetail('${product.id}')">
            ${inWishlist ? '♥ Saved' : '♡ Wishlist'}
          </button>
        </div>
        <button class="share-btn"
                onclick="App.shareProduct('${product.id}')">
          🔗 Share this product
        </button>
      </div>

      <div class="product-meta">
        <div class="product-meta-item">
          <strong>SKU:</strong>
          <span>${product.sku}</span>
        </div>
        <div class="product-meta-item">
          <strong>Category:</strong>
          <span>
            <a href="products.html?category=${product.category}"
               style="color:var(--primary)">
              ${product.category}
            </a>
          </span>
        </div>
        <div class="product-meta-item">
          <strong>Tags:</strong>
          <span>${product.tags.join(', ')}</span>
        </div>
      </div>

    </div>
  `;

  container.innerHTML = galleryHTML + infoHTML;
  if (tabs) tabs.style.display = 'block';
},

renderProductTabs(product) {
  const descTab     = document.getElementById('tab-description');
  const featuresTab = document.getElementById('tab-features');

  if (descTab) {
    descTab.innerHTML = `<p>${product.description}</p>`;
  }

  if (featuresTab) {
    if (product.features && product.features.length > 0) {
      featuresTab.innerHTML = `
        <ul class="features-list">
          ${product.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      `;
    } else {
      featuresTab.innerHTML = `<p>No additional features listed.</p>`;
    }
  }
},

initProductTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active to clicked button and its content
      btn.classList.add('active');
      const content = document.getElementById(`tab-${btn.dataset.tab}`);
      if (content) content.classList.add('active');
    });
  });
},

switchImage(src, thumbEl) {
  const mainImg = document.getElementById('galleryMainImg');
  if (mainImg) mainImg.src = src;

  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
},

selectColor(btn) {
  document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const selected = document.getElementById('selectedColor');
  if (selected) selected.textContent = btn.dataset.color;
},

selectSize(btn) {
  document.querySelectorAll('.size-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const selected = document.getElementById('selectedSize');
  if (selected) selected.textContent = btn.dataset.size;
},

decreaseDetailQty() {
  const input = document.getElementById('detailQuantity');
  if (!input) return;
  const val = parseInt(input.value);
  if (val > 1) input.value = val - 1;
},

increaseDetailQty(maxStock) {
  const input = document.getElementById('detailQuantity');
  if (!input) return;
  const val = parseInt(input.value);
  if (val < maxStock) input.value = val + 1;
},

addToCartFromDetail(productId) {
  const product  = ProductManager.getById(productId);
  if (!product) return;

  const quantity = parseInt(document.getElementById('detailQuantity').value) || 1;

  // Get selected color
  const activeColor = document.querySelector('.color-option.active');
  // Get selected size
  const activeSize  = document.querySelector('.size-option.active');

  // If product has sizes and none selected, warn
  if (product.sizes && product.sizes.length > 0 && !activeSize) {
    Cart.showNotification('Please select a size', 'warning');
    return;
  }

  const variant = {};
  if (activeColor) variant.color = activeColor.dataset.color;
  if (activeSize)  variant.size  = activeSize.dataset.size;

  const variantData = Object.keys(variant).length > 0 ? variant : null;

  Cart.addItem(product, quantity, variantData);
  this.openCartSidebar();
},

toggleWishlistDetail(productId) {
  this.toggleWishlist(productId);

  const btn        = document.getElementById('detailWishlistBtn');
  const inWishlist = this.isInWishlist(productId);

  if (btn) {
    btn.textContent = inWishlist ? '♥ Saved' : '♡ Wishlist';
    btn.classList.toggle('active', inWishlist);
  }
},

shareProduct(productId) {
  const url = `${window.location.origin}/product-detail.html?id=${productId}`;

  if (navigator.share) {
    // Uses native phone share if available
    navigator.share({
      title: document.title,
      url:   url
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      Cart.showNotification('Link copied to clipboard!', 'success');
    });
  }
},

renderRelatedProducts(product) {
  const section = document.getElementById('relatedSection');
  const grid    = document.getElementById('relatedProducts');

  if (!section || !grid) return;

  const related = ProductManager.getRelated(product.id, 4);

  if (related.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = related.map(p => this.createProductCard(p)).join('');
},

renderRecentlyViewed(currentProductId) {
  const section = document.getElementById('recentSection');
  const grid    = document.getElementById('recentProducts');

  if (!section || !grid) return;

  const recentIds = StorageManager.getRecentlyViewed()
    .filter(id => id !== currentProductId)
    .slice(0, 4);

  if (recentIds.length === 0) {
    section.style.display = 'none';
    return;
  }

  const products = recentIds
    .map(id => ProductManager.getById(id))
    .filter(p => p !== undefined);

  if (products.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = products.map(p => this.createProductCard(p)).join('');
},

 initCartPage() {
  this.renderCartPage();

  // Re-render whenever cart changes
  Cart.onChange(() => {
    this.renderCartPage();
  });
},

renderCartPage() {
  const container = document.getElementById('cartPageContent');
  if (!container) return;

  const items   = Cart.getItems();
  const summary = Cart.getSummary();

  // Empty cart state
  if (Cart.isEmpty()) {
    container.innerHTML = `
      <div class="cart-page-empty">
        <div class="cart-page-empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.
           Browse our products and find something you like.</p>
        <a href="products.html" class="btn btn-primary btn-lg">
          Browse Products
        </a>
      </div>
    `;

    // Hide recommendations when cart is empty
    const recs = document.getElementById('cartRecommendations');
    if (recs) recs.style.display = 'none';

    return;
  }

  // Build items HTML
  const itemsHTML = items.map(item => {
    const lineTotal   = item.price * item.quantity;
    const hasDiscount = item.originalPrice > item.price;

    return `
      <div class="cart-page-item" data-id="${item.productId}">

        <a href="product-detail.html?id=${item.productId}"
           class="cart-page-item-image">
          <img src="${item.image}" alt="${item.name}">
        </a>

        <div class="cart-page-item-info">
          <a href="product-detail.html?id=${item.productId}"
             class="cart-page-item-name">
            ${item.name}
          </a>

          ${item.variant ? `
            <p class="cart-page-item-variant">
              ${Object.values(item.variant).join(' · ')}
            </p>
          ` : ''}

          <p class="cart-page-item-price">
            ${Cart.formatPrice(item.price)}
            ${hasDiscount ? `
              <span class="cart-page-item-original-price">
                ${Cart.formatPrice(item.originalPrice)}
              </span>
            ` : ''}
          </p>
        </div>

        <div class="cart-page-item-quantity">
          <div class="quantity-control">
            <button class="quantity-btn"
                    onclick="App.cartPageUpdateQty('${item.productId}', ${item.quantity - 1})">
              −
            </button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn"
                    onclick="App.cartPageUpdateQty('${item.productId}', ${item.quantity + 1})">
              +
            </button>
          </div>
        </div>

        <div class="cart-page-item-total">
          ${Cart.formatPrice(lineTotal)}
        </div>

        <button class="cart-page-item-remove"
                onclick="App.cartPageRemove('${item.productId}')"
                aria-label="Remove ${item.name}">
          ×
        </button>

      </div>
    `;
  }).join('');

  // Build summary HTML
  const summaryHTML = `
    <h3>Order Summary</h3>

    <div class="cart-summary-rows">

      <div class="cart-summary-row">
        <span>Items (${summary.itemCount})</span>
        <span>${Cart.formatPrice(summary.subtotal)}</span>
      </div>

      ${summary.savings > 0 ? `
        <div class="cart-summary-row savings">
          <span>Savings</span>
          <span>− ${Cart.formatPrice(summary.savings)}</span>
        </div>
      ` : ''}

      <div class="cart-summary-row shipping-note">
        <span>Shipping</span>
        <span>Confirmed on WhatsApp</span>
      </div>

    </div>

    <div class="cart-summary-divider"></div>

    <div class="cart-summary-total">
      <span>Total</span>
      <span>${Cart.formatPrice(summary.subtotal)}</span>
    </div>

    <p class="cart-summary-note">
      Shipping fee not included
    </p>

    <div class="cart-summary-actions">
      <a href="checkout.html" class="btn btn-primary btn-block btn-lg">
        Proceed to Checkout
      </a>
      <a href="products.html" class="btn btn-outline btn-block">
        Continue Shopping
      </a>
    </div>
  `;

  // Build full page
  container.innerHTML = `
    <div class="cart-page-grid">

      <div class="cart-page-items">
        <div class="cart-page-header">
          <h2>Cart (${summary.itemCount} item${summary.itemCount !== 1 ? 's' : ''})</h2>
          <button class="cart-page-clear"
                  onclick="App.cartPageClearAll()">
            Clear All
          </button>
        </div>

        ${itemsHTML}

        <a href="products.html" class="cart-continue">
          ← Continue Shopping
        </a>
      </div>

      <div class="cart-page-summary-box">
        ${summaryHTML}
      </div>

    </div>
  `;

  // Render recommended products
  this.renderCartRecommendations();
},

cartPageUpdateQty(productId, newQuantity) {
  Cart.updateQuantity(productId, newQuantity);
},

cartPageRemove(productId) {
  Cart.removeItem(productId);
},

cartPageClearAll() {
  if (Cart.isEmpty()) return;

  // Simple confirmation
  const confirmed = confirm('Remove all items from your cart?');
  if (confirmed) {
    Cart.clear();
    Cart.showNotification('Cart cleared', 'info');
  }
},

renderCartRecommendations() {
  const section = document.getElementById('cartRecommendations');
  const grid    = document.getElementById('cartRecommendedGrid');
  if (!section || !grid) return;

  const items = Cart.getItems();
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }

  // Get cart product IDs
  const cartIds = items.map(item => item.productId);

  // Get related products from cart items categories
  // but exclude items already in the cart
  let recommended = [];

  items.forEach(item => {
    const product = ProductManager.getById(item.productId);
    if (!product) return;

    const related = ProductManager.getByCategory(product.category)
      .filter(p =>
        !cartIds.includes(p.id) &&
        !recommended.find(r => r.id === p.id) &&
        p.stock > 0
      );

    recommended = recommended.concat(related);
  });

  // Limit to 4 products
  recommended = recommended.slice(0, 4);

  if (recommended.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = recommended.map(p => this.createProductCard(p)).join('');
},

initCheckoutPage() {
  // If cart is empty redirect to products
  if (Cart.isEmpty()) {
    const empty = document.getElementById('checkoutEmptyState');
    const grid  = document.getElementById('checkoutGrid');
    if (empty) empty.style.display = 'block';
    if (grid)  grid.style.display  = 'none';
    return;
  }

  this.renderCheckoutSummary();
  this.initCheckoutForm();
},

renderCheckoutSummary() {
  const itemsContainer = document.getElementById('checkoutItems');
  const rowsContainer  = document.getElementById('checkoutSummaryRows');
  if (!itemsContainer || !rowsContainer) return;

  const items   = Cart.getItems();
  const summary = Cart.getSummary();

  // Render items
  itemsContainer.innerHTML = items.map(item => `
    <div class="checkout-item">
      <div class="checkout-item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-qty">
          ${item.variant
            ? Object.values(item.variant).join(' · ') + ' · '
            : ''}
          Qty: ${item.quantity}
        </p>
      </div>
      <span class="checkout-item-price">
        ${Cart.formatPrice(item.price * item.quantity)}
      </span>
    </div>
  `).join('');

  // Render summary rows
  rowsContainer.innerHTML = `
    <div class="cart-summary-row">
      <span>Subtotal</span>
      <span>${Cart.formatPrice(summary.subtotal)}</span>
    </div>

    ${summary.savings > 0 ? `
      <div class="cart-summary-row savings">
        <span>Savings</span>
        <span>− ${Cart.formatPrice(summary.savings)}</span>
      </div>
    ` : ''}

    <div class="cart-summary-row shipping-note">
      <span>Shipping</span>
      <span>Confirmed on WhatsApp</span>
    </div>

    <div class="checkout-summary-total">
      <span>Total</span>
      <span>${Cart.formatPrice(summary.subtotal)}</span>
    </div>
  `;
},

initCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  // Validate each field as user types
  const fields = ['firstName', 'lastName', 'email', 'phone', 'state', 'city', 'landmark'];

  fields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.addEventListener('blur', () => {
      this.validateField(fieldId);
    });

    input.addEventListener('input', () => {
      // Clear error when user starts typing
      if (input.classList.contains('invalid')) {
        this.validateField(fieldId);
      }
    });
  });

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    this.submitCheckout();
  });
},

validateField(fieldId) {
  const input    = document.getElementById(fieldId);
  const errorEl  = document.getElementById(`${fieldId}Error`);
  if (!input) return true;

  const value    = input.value.trim();
  let   error    = '';

  switch (fieldId) {
    case 'firstName':
    case 'lastName':
      if (!value) error = 'This field is required';
      else if (value.length < 2) error = 'Must be at least 2 characters';
      break;

    case 'email':
      if (!value) {
        error = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email';
      }
      break;

    case 'phone':
      if (!value) {
        error = 'Phone number is required';
      } else if (!/^[0-9]{10,11}$/.test(value.replace(/\s/g, ''))) {
        error = 'Enter a valid Nigerian phone number';
      }
      break;

    case 'landmark':
      if (!value) error = 'Landmark is required';
      else if (value.length < 5) error = 'Please enter a known landmark or bus stop';
      break;

    case 'city':
      if (!value) error = 'City is required';
      break;

    case 'state':
      if (!value) error = 'Please select your state';
      break;
  }

  if (error) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    if (errorEl) errorEl.textContent = error;
    return false;
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
    if (errorEl) errorEl.textContent = '';
    return true;
  }
},

validateAllFields() {
  const fields = ['firstName', 'lastName', 'email', 'phone', 'state', 'city', 'landmark'];
  let   isValid = true;

  fields.forEach(fieldId => {
    const fieldValid = this.validateField(fieldId);
    if (!fieldValid) isValid = false;
  });

  return isValid;
},

submitCheckout() {
  // Validate all fields first
  if (!this.validateAllFields()) {
    Cart.showNotification('Please fill in all required fields', 'error');

    // Scroll to first error
    const firstInvalid = document.querySelector('.form-input.invalid');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
    return;
  }

  // Collect form data
 const customerDetails = {
    name:        `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
    email:       document.getElementById('email').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
    state:       document.getElementById('state').value.trim(),
    city:        document.getElementById('city').value.trim(),
    landmark:    document.getElementById('landmark').value.trim(),
    description: document.getElementById('description').value.trim(),
    notes:       document.getElementById('notes').value.trim()
  };

  // Build and save order
  const order = {
    id:       this.generateOrderId(),
    date:     new Date().toISOString(),
    items:    Cart.getItems(),
    summary:  Cart.getSummary(),
    customer: customerDetails,
    status:   'pending'
  };

  StorageManager.saveOrder(order);
  StorageManager.saveLastOrder(order);

  // Show loading state on button
  const btn = document.getElementById('placeOrderBtn');
  btn.textContent = 'Opening WhatsApp...';
  btn.disabled    = true;

  // Send to WhatsApp
  // Replace this number with your friend's real WhatsApp number
  const whatsappNumber = '2347038820430';
  Cart.sendWhatsAppOrder(customerDetails, whatsappNumber);

  // Clear the cart
  Cart.clear();

  // Redirect to confirmation page after short delay
  // Delay gives WhatsApp time to open first
  setTimeout(() => {
    window.location.href = `order-confirmation.html?order=${order.id}`;
  }, 1500);
},

  initOrderConfirmationPage() {
  var container = document.getElementById('confirmationContent');
  if (!container) return;

  var order = StorageManager.getLastOrder();

  if (!order) {
    container.innerHTML = ''
      + '<div class="confirmation-no-order">'
      + '  <div class="confirmation-no-order-icon">📦</div>'
      + '  <h2>No order found</h2>'
      + '  <p>It looks like you haven\'t placed an order yet.</p>'
      + '  <a href="products.html" class="btn btn-primary btn-lg">Browse Products</a>'
      + '</div>';
    return;
  }

  var orderDate = new Date(order.date);
  var dateString = orderDate.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  var timeString = orderDate.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build items HTML
  var itemsHTML = '';
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    var variantText = '';

    if (item.variant) {
      var vals = [];
      for (var key in item.variant) {
        vals.push(item.variant[key]);
      }
      variantText = vals.join(' · ') + ' · ';
    }

    itemsHTML += ''
      + '<div class="confirmation-item">'
      + '  <div class="confirmation-item-image">'
      + '    <img src="' + item.image + '" alt="' + item.name + '">'
      + '  </div>'
      + '  <div class="confirmation-item-info">'
      + '    <p class="confirmation-item-name">' + item.name + '</p>'
      + '    <p class="confirmation-item-meta">' + variantText + 'Qty: ' + item.quantity + '</p>'
      + '  </div>'
      + '  <span class="confirmation-item-price">'
      +      Cart.formatPrice(item.price * item.quantity)
      + '  </span>'
      + '</div>';
  }

  // Savings row
  var savingsHTML = '';
  if (order.summary.savings > 0) {
    savingsHTML = ''
      + '<div class="confirmation-summary-row savings">'
      + '  <span>Savings</span>'
      + '  <span>− ' + Cart.formatPrice(order.summary.savings) + '</span>'
      + '</div>';
  }

  // Delivery info
  var deliveryHTML = '';

  deliveryHTML += '<div class="confirmation-delivery-item">';
  deliveryHTML += '  <strong>Name</strong>';
  deliveryHTML += '  <span>' + order.customer.name + '</span>';
  deliveryHTML += '</div>';

  deliveryHTML += '<div class="confirmation-delivery-item">';
  deliveryHTML += '  <strong>Phone</strong>';
  deliveryHTML += '  <span>' + order.customer.phone + '</span>';
  deliveryHTML += '</div>';

  deliveryHTML += '<div class="confirmation-delivery-item">';
  deliveryHTML += '  <strong>State</strong>';
  deliveryHTML += '  <span>' + order.customer.state + '</span>';
  deliveryHTML += '</div>';

  deliveryHTML += '<div class="confirmation-delivery-item">';
  deliveryHTML += '  <strong>City</strong>';
  deliveryHTML += '  <span>' + order.customer.city + '</span>';
  deliveryHTML += '</div>';

  if (order.customer.landmark) {
    deliveryHTML += '<div class="confirmation-delivery-item">';
    deliveryHTML += '  <strong>Landmark</strong>';
    deliveryHTML += '  <span>' + order.customer.landmark + '</span>';
    deliveryHTML += '</div>';
  }

  if (order.customer.description && order.customer.description.length > 0) {
    deliveryHTML += '<div class="confirmation-delivery-item">';
    deliveryHTML += '  <strong>Directions</strong>';
    deliveryHTML += '  <span>' + order.customer.description + '</span>';
    deliveryHTML += '</div>';
  }

  // Build full page
  container.innerHTML = ''
    + '<div class="confirmation-page">'

    // Success header
    + '  <div class="confirmation-icon">✓</div>'
    + '  <h1 class="confirmation-title">Order Placed!</h1>'
    + '  <p class="confirmation-subtitle">Thank you for your order</p>'
    + '  <span class="confirmation-order-id">' + order.id + '</span>'

    // WhatsApp reminder
    + '  <div class="confirmation-whatsapp">'
    + '    <span class="confirmation-whatsapp-icon">💬</span>'
    + '    <div>'
    + '      <strong>Check your WhatsApp</strong>'
    + '      <p>Your order has been sent to our WhatsApp. '
    + '         We will reply shortly to confirm your order '
    + '         and let you know the delivery fee. '
    + '         Make sure to send the message if it hasn\'t '
    + '         been sent already.</p>'
    + '    </div>'
    + '  </div>'

    // Order details box
    + '  <div class="confirmation-details">'

    // Header
    + '    <div class="confirmation-details-header">'
    + '      <h3>Order Details</h3>'
    + '      <span class="confirmation-details-date">'
    +          dateString + ' at ' + timeString
    + '      </span>'
    + '    </div>'

    // Items
    + '    <div class="confirmation-items">'
    +        itemsHTML
    + '    </div>'

    // Summary
    + '    <div class="confirmation-summary">'
    + '      <div class="confirmation-summary-row">'
    + '        <span>Subtotal</span>'
    + '        <span>' + Cart.formatPrice(order.summary.subtotal) + '</span>'
    + '      </div>'
    +        savingsHTML
    + '      <div class="confirmation-summary-row shipping">'
    + '        <span>Shipping</span>'
    + '        <span>To be confirmed on WhatsApp</span>'
    + '      </div>'
    + '      <div class="confirmation-total-row">'
    + '        <span>Total</span>'
    + '        <span>' + Cart.formatPrice(order.summary.subtotal) + '</span>'
    + '      </div>'
    + '    </div>'

    // Delivery info
    + '    <div class="confirmation-delivery">'
    + '      <h4>Delivery Information</h4>'
    + '      <div class="confirmation-delivery-grid">'
    +          deliveryHTML
    + '      </div>'
    + '    </div>'

    + '  </div>'

    // Actions
    + '  <div class="confirmation-actions">'
    + '    <a href="tracking.html?order=' + order.id + '" class="btn btn-primary btn-lg">'
    + '      Track My Order'
    + '    </a>'
    + '    <a href="products.html" class="btn btn-outline btn-lg">'
    + '      Continue Shopping'
    + '    </a>'
    + '  </div>'

    + '</div>';
},
 initWishlistPage() {
  this.renderWishlist();
  this.bindWishlistEvents();
},

renderWishlist() {
  var grid     = document.getElementById('wishlistGrid');
  var empty    = document.getElementById('wishlistEmpty');
  var top      = document.getElementById('wishlistTop');
  var countEl  = document.getElementById('wishlistCount');

  if (!grid || !empty || !top) return;

  var wishlistIds = StorageManager.getWishlist();

  // Get full product data for each saved ID
  var products = [];
  for (var i = 0; i < wishlistIds.length; i++) {
    var product = ProductManager.getById(wishlistIds[i]);
    if (product) {
      products.push(product);
    }
  }

  // Empty state
  if (products.length === 0) {
    grid.style.display  = 'none';
    top.style.display   = 'none';
    empty.style.display = 'block';
    return;
  }

  // Show products
  grid.style.display  = 'grid';
  top.style.display   = 'flex';
  empty.style.display = 'none';

  // Update count
  if (countEl) {
    countEl.textContent = products.length + ' item' + (products.length !== 1 ? 's' : '') + ' saved';
  }

  // Render product cards
  grid.innerHTML = products.map(function(product) {
    var price    = ProductManager.getPrice(product);
    var isNew    = ProductManager.isNew(product.dateAdded);
    var discount = product.onSale
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;

    return ''
      + '<div class="product-card" data-product-id="' + product.id + '">'

      // Image
      + '  <div class="product-card-image">'
      + '    <a href="product-detail.html?id=' + product.id + '">'
      + '      <img src="' + product.images[0] + '"'
      + '           alt="' + product.name + '"'
      + '           loading="lazy">'
      + '    </a>'

      // Badges
      + '    <div class="product-badges">'
      + (product.onSale
          ? '<span class="product-badge badge-sale">-' + discount + '%</span>'
          : '')
      + (isNew && !product.onSale
          ? '<span class="product-badge badge-new">New</span>'
          : '')
      + '    </div>'

      // Remove from wishlist button
      + '    <div class="product-card-actions" style="opacity:1;transform:none">'
      + '      <button class="product-action-btn active"'
      + '              onclick="App.removeFromWishlist(\'' + product.id + '\')"'
      + '              aria-label="Remove from wishlist">'
      + '        ♥'
      + '      </button>'
      + '    </div>'

      + '  </div>'

      // Body
      + '  <div class="product-card-body">'
      + '    <p class="product-card-category">' + product.category + '</p>'
      + '    <h3 class="product-card-title">'
      + '      <a href="product-detail.html?id=' + product.id + '">'
      +          product.name
      + '      </a>'
      + '    </h3>'
      + '    <div class="product-rating">'
      + '      <span class="stars">' + App.getStarsHTML(product.rating) + '</span>'
      + '      <span class="rating-count">(' + product.reviewCount + ')</span>'
      + '    </div>'
      + '    <div class="product-card-price">'
      + '      <span class="price-current">' + ProductManager.formatPrice(price) + '</span>'
      + (product.onSale
          ? '<span class="price-original">' + ProductManager.formatPrice(product.price) + '</span>'
            + '<span class="price-discount">-' + discount + '%</span>'
          : '')
      + '    </div>'

      // Stock status
      + (product.stock <= 0
          ? '<p style="font-size:var(--font-size-xs);color:var(--error);margin-top:var(--space-2)">Out of Stock</p>'
          : product.stock <= 5
            ? '<p style="font-size:var(--font-size-xs);color:var(--warning);margin-top:var(--space-2)">Only ' + product.stock + ' left</p>'
            : '')

      + '  </div>'

      // Footer
      + '  <div class="product-card-footer">'
      + (product.stock > 0
          ? '<button class="add-to-cart-btn"'
            + '        onclick="App.wishlistAddToCart(\'' + product.id + '\')">'
            + '  Add to Cart'
            + '</button>'
          : '<button class="add-to-cart-btn" disabled>Out of Stock</button>')
      + '  </div>'

      + '</div>';
  }).join('');
},

removeFromWishlist(productId) {
  var wishlist = StorageManager.getWishlist();
  var index = wishlist.indexOf(productId);

  if (index > -1) {
    wishlist.splice(index, 1);
    StorageManager.saveWishlist(wishlist);
    Cart.showNotification('Removed from wishlist', 'info');
    this.updateWishlistBadge();
    this.renderWishlist();
  }
},

wishlistAddToCart(productId) {
  var product = ProductManager.getById(productId);
  if (!product) return;

  var added = Cart.addItem(product, 1, null);

  if (added) {
    this.openCartSidebar();
  }
},

bindWishlistEvents() {
  var clearBtn = document.getElementById('wishlistClear');
  if (!clearBtn) return;

  var self = this;

  clearBtn.addEventListener('click', function() {
    var wishlist = StorageManager.getWishlist();
    if (wishlist.length === 0) return;

    var confirmed = confirm('Remove all items from your wishlist?');
    if (confirmed) {
      StorageManager.saveWishlist([]);
      self.updateWishlistBadge();
      Cart.showNotification('Wishlist cleared', 'info');
      self.renderWishlist();
    }
  });
},

initTrackingPage() {
  var self     = this;
  var input    = document.getElementById('trackingInput');
  var btn      = document.getElementById('trackingBtn');
  var errorEl  = document.getElementById('trackingError');

  if (!input || !btn) return;

  // Check if order ID was passed in URL
  var urlOrderId = this.getUrlParam('order');
  if (urlOrderId) {
    input.value = urlOrderId;
    this.trackOrder(urlOrderId);
  }

  // Track button click
  btn.addEventListener('click', function() {
    var orderId = input.value.trim();

    if (!orderId) {
      errorEl.textContent = 'Please enter an order number';
      input.classList.add('invalid');
      return;
    }

    errorEl.textContent = '';
    input.classList.remove('invalid');
    self.trackOrder(orderId);
  });

  // Enter key
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      btn.click();
    }
  });
},

async loadProducts() {
  try {
    // Try loading from Firestore first
    var firestoreProducts   = await FirestoreManager.getProducts();
    var firestoreCategories = await FirestoreManager.getCategories();

    if (firestoreProducts.length > 0) {
      // Use Firestore data
      this.products   = firestoreProducts;
      this.categories = firestoreCategories;
      console.log('Products loaded from Firestore');
      return this.products;
    }

    // Fallback to JSON file if Firestore is empty
    console.log('Firestore empty, loading from JSON');
    var response = await fetch('data/products.json');
    var data     = await response.json();

    this.products   = data.products;
    this.categories = data.categories;

    return this.products;

  } catch (error) {
    console.error('Failed to load products:', error);

    // Final fallback to JSON
    try {
      var response = await fetch('data/products.json');
      var data     = await response.json();
      this.products   = data.products;
      this.categories = data.categories;
      return this.products;
    } catch (e) {
      this.products   = [];
      this.categories = [];
      return [];
    }
  }
},
  initContactPage() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var self = this;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    self.submitContactForm();
  });
},

submitContactForm() {
  var name    = document.getElementById('contactName');
  var email   = document.getElementById('contactEmail');
  var subject = document.getElementById('contactSubject');
  var message = document.getElementById('contactMessage');

  var isValid = true;

  // Validate name
  if (!name.value.trim()) {
    name.classList.add('invalid');
    document.getElementById('contactNameError').textContent = 'Name is required';
    isValid = false;
  } else {
    name.classList.remove('invalid');
    name.classList.add('valid');
    document.getElementById('contactNameError').textContent = '';
  }

  // Validate email
  if (!email.value.trim()) {
    email.classList.add('invalid');
    document.getElementById('contactEmailError').textContent = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.classList.add('invalid');
    document.getElementById('contactEmailError').textContent = 'Enter a valid email';
    isValid = false;
  } else {
    email.classList.remove('invalid');
    email.classList.add('valid');
    document.getElementById('contactEmailError').textContent = '';
  }

  // Validate subject
  if (!subject.value) {
    subject.classList.add('invalid');
    document.getElementById('contactSubjectError').textContent = 'Please select a subject';
    isValid = false;
  } else {
    subject.classList.remove('invalid');
    subject.classList.add('valid');
    document.getElementById('contactSubjectError').textContent = '';
  }

  // Validate message
  if (!message.value.trim()) {
    message.classList.add('invalid');
    document.getElementById('contactMessageError').textContent = 'Message is required';
    isValid = false;
  } else if (message.value.trim().length < 10) {
    message.classList.add('invalid');
    document.getElementById('contactMessageError').textContent = 'Message too short';
    isValid = false;
  } else {
    message.classList.remove('invalid');
    message.classList.add('valid');
    document.getElementById('contactMessageError').textContent = '';
  }

  if (!isValid) {
    Cart.showNotification('Please fill in all required fields', 'error');
    return;
  }

  // Build WhatsApp message
  var whatsappMsg = '';
  whatsappMsg += 'Hello! I have a question 📩\n';
  whatsappMsg += '\n';
  whatsappMsg += 'Name: ' + name.value.trim() + '\n';
  whatsappMsg += 'Email: ' + email.value.trim() + '\n';
  whatsappMsg += 'Subject: ' + subject.value + '\n';
  whatsappMsg += '\n';
  whatsappMsg += 'Message:\n';
  whatsappMsg += message.value.trim() + '\n';

  // Replace with your friend's real WhatsApp number
  var whatsappNumber = '2347038820430';
  var url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(whatsappMsg);
  window.open(url, '_blank');

  // Show success state
  document.getElementById('contactForm').style.display = 'none';
  document.getElementById('contactSuccess').style.display = 'block';

  Cart.showNotification('WhatsApp opened with your message!', 'success');
},

resetContactForm() {
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('contactSuccess');

  if (form) {
    form.style.display = 'block';
    form.reset();

    // Clear all validation styles
    var inputs = form.querySelectorAll('.form-input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.remove('valid');
      inputs[i].classList.remove('invalid');
    }

    var errors = form.querySelectorAll('.form-error');
    for (var j = 0; j < errors.length; j++) {
      errors[j].textContent = '';
    }
  }

  if (success) {
    success.style.display = 'none';
  }
},
initFaqPage() {
  this.faqData = this.getFaqData();
  this.currentFaqCategory = 'all';
  this.currentFaqSearch   = '';

  this.renderFaqItems(this.faqData);
  this.bindFaqEvents();
},

getFaqData() {
  return [
    // ── ORDERS ──────────────────────────────
    {
      id:       1,
      category: 'orders',
      question: 'How do I place an order?',
      answer:   'Placing an order is easy. Browse our products, add items to your cart, go to checkout, fill in your details and click "Place Order on WhatsApp". WhatsApp will open with your complete order details. Simply send the message and we will confirm your order shortly.'
    },
    {
      id:       2,
      category: 'orders',
      question: 'Can I change or cancel my order?',
      answer:   'Yes, you can change or cancel your order as long as it has not been shipped yet. Simply message us on WhatsApp as soon as possible with your order number and the changes you want to make.'
    },
    {
      id:       3,
      category: 'orders',
      question: 'How do I know my order was received?',
      answer:   'After you send your order on WhatsApp, we will reply to confirm we received it. We will also confirm the delivery fee and expected delivery time at that point.'
    },
    {
      id:       4,
      category: 'orders',
      question: 'Can I order multiple items at once?',
      answer:   'Absolutely. Add as many items as you want to your cart before checking out. Everything will be included in one WhatsApp message and delivered together.'
    },

    // ── DELIVERY ─────────────────────────────
    {
      id:       5,
      category: 'delivery',
      question: 'How much is delivery?',
      answer:   'Delivery fees vary depending on your location. After you place your order on WhatsApp, we will confirm the exact delivery fee based on where you are. We always let you know before anything is sent.'
    },
    {
      id:       6,
      category: 'delivery',
      question: 'How long does delivery take?',
      answer:   'Delivery time depends on your location. We will confirm the expected delivery time when we reply to your WhatsApp order. We always aim to deliver as fast as possible.'
    },
    {
      id:       7,
      category: 'delivery',
      question: 'Do you deliver nationwide?',
      answer:   'Yes we deliver across Nigeria. Whether you are in Lagos, Abuja, Port Harcourt or anywhere else, we can get your order to you. Message us on WhatsApp for more details about your specific area.'
    },
    {
      id:       8,
      category: 'delivery',
      question: 'What do I use as my delivery address?',
      answer:   'We do not need an exact street address. Just tell us your state, city and a well known landmark or bus stop near you. For example: "Ikeja, Lagos — Computer Village bus stop". We will figure out the rest with you on WhatsApp.'
    },

    // ── PRODUCTS ─────────────────────────────
    {
      id:       9,
      category: 'products',
      question: 'Are all products in stock?',
      answer:   'Products showing "In Stock" are available and ready to ship. If a product shows "Out of Stock" it is currently not available. We update stock regularly so check back often.'
    },
    {
      id:       10,
      category: 'products',
      question: 'What sizes do you carry?',
      answer:   'Sizes vary by product. Check the individual product page for available sizes. If you are not sure about sizing, message us on WhatsApp before ordering and we will help you pick the right size.'
    },
    {
      id:       11,
      category: 'products',
      question: 'Are the product photos accurate?',
      answer:   'Yes. All photos are taken of the actual products we sell. Colors may appear slightly different depending on your screen settings but we do our best to show the most accurate representation.'
    },
    {
      id:       12,
      category: 'products',
      question: 'Can I see more photos of a product?',
      answer:   'Some products have multiple photos you can browse on the product page. If you want to see more angles or details, message us on WhatsApp and we will send you more pictures.'
    },

    // ── PAYMENT ──────────────────────────────
    {
      id:       13,
      category: 'payment',
      question: 'How do I pay for my order?',
      answer:   'Payment details are confirmed on WhatsApp after you place your order. We will send you our account details and you pay before delivery. We accept bank transfer.'
    },
    {
      id:       14,
      category: 'payment',
      question: 'Do I pay before or after delivery?',
      answer:   'Payment is made before delivery. Once you confirm you have paid, we process and ship your order. This protects both you and us.'
    },
    {
      id:       15,
      category: 'payment',
      question: 'Is my payment secure?',
      answer:   'Yes. All payments are made directly via bank transfer. We never ask for your card details or passwords. If anyone claiming to be us asks for that information, please ignore and report it.'
    },

    // ── RETURNS ──────────────────────────────
    {
      id:       16,
      category: 'returns',
      question: 'What is your return policy?',
      answer:   'If there is a problem with your order such as wrong item, damaged item or something missing, contact us on WhatsApp within 48 hours of receiving your order and we will sort it out.'
    },
    {
      id:       17,
      category: 'returns',
      question: 'What if I receive the wrong item?',
      answer:   'We are very sorry if this happens. Contact us immediately on WhatsApp with your order number and a photo of what you received. We will arrange a replacement or refund as quickly as possible.'
    },
    {
      id:       18,
      category: 'returns',
      question: 'Can I exchange an item for a different size?',
      answer:   'Yes, exchanges are possible if the item has not been worn and is still in its original condition. Message us on WhatsApp within 48 hours of receiving your order to arrange an exchange.'
    }
  ];
},

renderFaqItems(items) {
  var list      = document.getElementById('faqList');
  var noResults = document.getElementById('faqNoResults');

  if (!list || !noResults) return;

  if (items.length === 0) {
    list.style.display      = 'none';
    noResults.style.display = 'block';
    return;
  }

  list.style.display      = 'flex';
  noResults.style.display = 'none';

  var self = this;

  list.innerHTML = items.map(function(item) {
    return ''
      + '<div class="faq-item" data-id="' + item.id + '">'
      + '  <button class="faq-question"'
      + '          onclick="App.toggleFaq(' + item.id + ')">'
      + '    <span class="faq-question-text">' + item.question + '</span>'
      + '    <span class="faq-chevron">▾</span>'
      + '  </button>'
      + '  <div class="faq-answer">'
      + '    <div class="faq-answer-inner">'
      + '      <p>' + item.answer + '</p>'
      + '    </div>'
      + '  </div>'
      + '</div>';
  }).join('');
},

toggleFaq(id) {
  var item = document.querySelector('.faq-item[data-id="' + id + '"]');
  if (!item) return;

  var isOpen = item.classList.contains('open');

  // Close all open items first
  var allItems = document.querySelectorAll('.faq-item');
  for (var i = 0; i < allItems.length; i++) {
    allItems[i].classList.remove('open');
  }

  // If it was closed, open it
  if (!isOpen) {
    item.classList.add('open');
  }
},

filterFaq() {
  var data = this.faqData;

  // Filter by category
  if (this.currentFaqCategory !== 'all') {
    data = data.filter(function(item) {
      return item.category === this.currentFaqCategory;
    }.bind(this));
  }

  // Filter by search
  if (this.currentFaqSearch.length > 0) {
    var q = this.currentFaqSearch.toLowerCase();
    data = data.filter(function(item) {
      return item.question.toLowerCase().includes(q) ||
             item.answer.toLowerCase().includes(q);
    });
  }

  this.renderFaqItems(data);
},

bindFaqEvents() {
  var self = this;

  // Category tabs
  var tabs = document.querySelectorAll('.faq-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      self.currentFaqCategory = tab.dataset.category;
      self.filterFaq();
    });
  });

  // Search
  var searchInput = document.getElementById('faqSearch');
  if (!searchInput) return;

  var debounce;
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounce);
    debounce = setTimeout(function() {
      self.currentFaqSearch = e.target.value.trim();
      self.filterFaq();
    }, 300);
  });
},

  // ── HELPERS ──────────────────────────────

  // Creates a unique order ID using current timestamp
  generateOrderId() {
    return `ORD-${Date.now()}`;
  },

  // Format price — available app-wide
  formatPrice(amount) {
    return `₦${amount.toLocaleString('en-NG')}`;
  },

  // Get URL parameter by name
  // Used to read ?id=prod-001 or ?search=shoes from URL
  getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  // Scroll to an element smoothly
  scrollTo(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // Creates star rating HTML from a number
  // 4.5 → ★★★★½☆ (not used yet but needed later)
  getStarsHTML(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;

    return '★'.repeat(full) + (half ? '✭' : '') + '☆'.repeat(empty);
  },
  // ── AUTH MODAL ──────────────────────────────

  openAuthModal() {
  var modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  this.showLoginForm();
},

closeAuthModal() {
  var modal = document.getElementById('authModal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
},

showLoginForm() {
  document.getElementById('loginForm').style.display    = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('resetForm').style.display    = 'none';
},

showRegisterForm() {
  document.getElementById('loginForm').style.display    = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('resetForm').style.display    = 'none';
},

showResetForm() {
  document.getElementById('loginForm').style.display    = 'none';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('resetForm').style.display    = 'block';
},

async handleLogin() {
  var email    = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;

  // Clear errors
  document.getElementById('loginEmailError').textContent    = '';
  document.getElementById('loginPasswordError').textContent = '';

  if (!email) {
    document.getElementById('loginEmailError').textContent = 'Email is required';
    return;
  }

  if (!password) {
    document.getElementById('loginPasswordError').textContent = 'Password is required';
    return;
  }

  var btn = document.getElementById('loginBtn');
  btn.textContent = 'Logging in...';
  btn.disabled    = true;

  var result = await AuthManager.login(email, password);

  if (result.success) {
    Cart.showNotification('Welcome back!', 'success');
    this.closeAuthModal();
    this.updateAuthAvatar();
  } else {
    document.getElementById('loginEmailError').textContent = result.error;
  }

  btn.textContent = 'Log In';
  btn.disabled    = false;
},

async handleRegister() {
  var name     = document.getElementById('registerName').value.trim();
  var email    = document.getElementById('registerEmail').value.trim();
  var password = document.getElementById('registerPassword').value;

  // Clear errors
  document.getElementById('registerNameError').textContent     = '';
  document.getElementById('registerEmailError').textContent    = '';
  document.getElementById('registerPasswordError').textContent = '';

  var isValid = true;

  if (!name) {
    document.getElementById('registerNameError').textContent = 'Name is required';
    isValid = false;
  }

  if (!email) {
    document.getElementById('registerEmailError').textContent = 'Email is required';
    isValid = false;
  }

  if (!password) {
    document.getElementById('registerPasswordError').textContent = 'Password is required';
    isValid = false;
  } else if (password.length < 6) {
    document.getElementById('registerPasswordError').textContent = 'At least 6 characters';
    isValid = false;
  }

  if (!isValid) return;

  var btn = document.getElementById('registerBtn');
  btn.textContent = 'Creating account...';
  btn.disabled    = true;

  var result = await AuthManager.register(email, password, name);

  if (result.success) {
    Cart.showNotification('Account created! Welcome!', 'success');
    this.closeAuthModal();
    this.updateAuthAvatar();
  } else {
    document.getElementById('registerEmailError').textContent = result.error;
  }

  btn.textContent = 'Create Account';
  btn.disabled    = false;
},

async handleGoogleLogin() {
  var result = await AuthManager.loginWithGoogle();

  if (result.success) {
    Cart.showNotification('Welcome!', 'success');
    this.closeAuthModal();
    this.updateAuthAvatar();
  } else {
    Cart.showNotification(result.error, 'error');
  }
},

async handleLogout() {
  var result = await AuthManager.logout();

  if (result.success) {
    Cart.showNotification('Logged out successfully', 'info');
    this.updateAuthAvatar();
  }
},

async handleResetPassword() {
  var email = document.getElementById('resetEmail').value.trim();

  document.getElementById('resetEmailError').textContent = '';

  if (!email) {
    document.getElementById('resetEmailError').textContent = 'Email is required';
    return;
  }

  var result = await AuthManager.resetPassword(email);

  if (result.success) {
    Cart.showNotification('Reset link sent! Check your email.', 'success');
    this.showLoginForm();
  } else {
    document.getElementById('resetEmailError').textContent = result.error;
  }
},

updateAuthAvatar() {
  var avatarEls = document.querySelectorAll('.auth-avatar');

  if (AuthManager.isLoggedIn()) {
    var name    = AuthManager.getUserName();
    var initials = '';

    if (name) {
      var parts = name.split(' ');
      initials  = parts[0].charAt(0).toUpperCase();
      if (parts.length > 1) {
        initials += parts[1].charAt(0).toUpperCase();
      }
    }

    avatarEls.forEach(function(el) {
      el.textContent = initials || '?';
    });
  }
},

};

// ── START THE APP ─────────────────────────
// Waits for ALL HTML to be loaded
// before running App.init()
// Without this, JS might run before
// HTML elements exist and crash
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

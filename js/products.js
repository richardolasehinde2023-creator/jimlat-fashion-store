// ============================================
// PRODUCT MANAGER
// ============================================

const ProductManager = {

  products: [],
  categories: [],

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
  getAll() {
    return this.products;
  },

  getById(id) {
    return this.products.find(p => p.id === id);
  },

  getBySlug(slug) {
    return this.products.find(p => p.slug === slug);
  },

  getByCategory(category) {
    return this.products.filter(p => p.category === category);
  },

  getFeatured() {
    return this.products.filter(p => p.featured === true);
  },

  getOnSale() {
    return this.products.filter(p => p.onSale === true);
  },

  getNewArrivals(limit = 8) {
    return [...this.products]
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, limit);
  },

  getRelated(productId, limit = 4) {
    const product = this.getById(productId);
    if (!product) return [];

    return this.products
      .filter(p => p.id !== productId && p.category === product.category)
      .slice(0, limit);
  },

  search(query) {
    const q = query.toLowerCase().trim();

    if (!q) return this.products;

    return this.products.filter(p =>
      p.name.toLowerCase().includes(q)        ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)    ||
      p.tags.some(tag => tag.toLowerCase().includes(q))
    );
  },

  filter(options = {}) {
    let results = [...this.products];

    if (options.category && options.category !== 'all') {
      results = results.filter(p => p.category === options.category);
    }

    if (options.minPrice !== undefined) {
      results = results.filter(p => {
        const price = p.onSale ? p.salePrice : p.price;
        return price >= options.minPrice;
      });
    }

    if (options.maxPrice !== undefined) {
      results = results.filter(p => {
        const price = p.onSale ? p.salePrice : p.price;
        return price <= options.maxPrice;
      });
    }

    if (options.onSaleOnly) {
      results = results.filter(p => p.onSale === true);
    }

    if (options.inStockOnly) {
      results = results.filter(p => p.stock > 0);
    }

    if (options.minRating) {
      results = results.filter(p => p.rating >= options.minRating);
    }

    if (options.sort) {
      switch (options.sort) {
        case 'price-low':
          results.sort((a, b) => {
            const priceA = a.onSale ? a.salePrice : a.price;
            const priceB = b.onSale ? b.salePrice : b.price;
            return priceA - priceB;
          });
          break;

        case 'price-high':
          results.sort((a, b) => {
            const priceA = a.onSale ? a.salePrice : a.price;
            const priceB = b.onSale ? b.salePrice : b.price;
            return priceB - priceA;
          });
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
          results.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
          break;
      }
    }

    return results;
  },

  getPriceRange() {
    const prices = this.products.map(p =>
      p.onSale ? p.salePrice : p.price
    );

    if (prices.length === 0) {
      return { min: 0, max: 100000 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  },

  getPrice(product) {
    return product.onSale ? product.salePrice : product.price;
  },

  formatPrice(amount) {
    return `₦${amount.toLocaleString('en-NG')}`;
  },

  isNew(dateAdded) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(dateAdded) > thirtyDaysAgo;
    }

};
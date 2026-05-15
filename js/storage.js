 // ============================================
// STORAGE MANAGER
// ============================================

const StorageManager = {

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage read error:', error);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage write error:', error);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },

  // Cart
  getCart() {
    return this.get('store_cart') || [];
  },

  saveCart(cart) {
    this.set('store_cart', cart);
  },

  // Wishlist
  getWishlist() {
    return this.get('store_wishlist') || [];
  },

  saveWishlist(wishlist) {
    this.set('store_wishlist', wishlist);
  },

  // User Preferences
  getPreferences() {
    return this.get('store_prefs') || {
      theme: 'light',
      viewMode: 'grid',
      currency: 'NGN',
      shipping: 'whatsappp'
    };
  },

  savePreferences(prefs) {
    this.set('store_prefs', prefs);
  },

  // Recently Viewed
  getRecentlyViewed() {
    return this.get('store_recent') || [];
  },

  addRecentlyViewed(productId) {
    let recent = this.getRecentlyViewed();
    recent = recent.filter(id => id !== productId);
    recent.unshift(productId);
    recent = recent.slice(0, 10);
    this.set('store_recent', recent);
  },

  // Orders
  getOrders() {
    return this.get('store_orders') || [];
  },

  saveOrder(order) {
    const orders = this.getOrders();
    orders.push(order);
    this.set('store_orders', orders);
  },

  getLastOrder() {
    return this.get('store_last_order') || null;
  },

  saveLastOrder(order) {
    this.set('store_last_order', order);
  }
  
};
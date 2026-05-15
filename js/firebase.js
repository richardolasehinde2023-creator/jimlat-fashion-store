// ============================================
// FIREBASE CONFIGURATION
// Connects the store to Firebase
// ============================================

const firebaseConfig = {
  apiKey:            'AIzaSyAdiDfkzuCJVaj6nyfONcF_3OVcAS79iw0',
  authDomain:        'jimlat-fashion-store.firebaseapp.com',
  projectId:         'jimlat-fashion-store',
  storageBucket:     'jimlat-fashion-store.firebasestorage.app',
  messagingSenderId: '906090061473',
  appId:             '1:906090061473:web:21fc6f78c5573df13c9ae0'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore database
var db   = firebase.firestore();

// Initialize Auth
var auth = firebase.auth();

// ============================================
// FIRESTORE MANAGER
// Handles all database operations
// ============================================

var FirestoreManager = {

  // ── PRODUCTS ─────────────────────────────

  // Get all products from Firestore
  async getProducts() {
    try {
      var snapshot = await db.collection('products').get();
      var products = [];

      snapshot.forEach(function(doc) {
        var data   = doc.data();
        data.id    = doc.id;
        products.push(data);
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  },

  // Get single product by ID
  async getProductById(id) {
    try {
      var doc = await db.collection('products').doc(id).get();

      if (doc.exists) {
        var data = doc.data();
        data.id  = doc.id;
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  },

  // Get all categories
  async getCategories() {
    try {
      var snapshot = await db.collection('categories').get();
      var categories = [];

      snapshot.forEach(function(doc) {
        var data = doc.data();
        data.id  = doc.id;
        categories.push(data);
      });

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  },

  // ── ORDERS ───────────────────────────────

  // Save order to Firestore
  async saveOrder(order) {
    try {
      await db.collection('orders').doc(order.id).set(order);
      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      return false;
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      var doc = await db.collection('orders').doc(orderId).get();

      if (doc.exists) {
        return doc.data();
      }

      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  },

  // Get all orders for a user
  async getOrdersByEmail(email) {
    try {
      var snapshot = await db.collection('orders')
        .where('customer.email', '==', email)
        .orderBy('date', 'desc')
        .get();

      var orders = [];
      snapshot.forEach(function(doc) {
        orders.push(doc.data());
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  },

  // Update order status (used by admin)
  async updateOrderStatus(orderId, status) {
    try {
      await db.collection('orders').doc(orderId).update({
        status: status
      });
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  },

  // ── WISHLIST ─────────────────────────────

  // Save wishlist to Firestore for logged in users
  async saveWishlist(userId, wishlist) {
    try {
      await db.collection('wishlists').doc(userId).set({
        items:     wishlist,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error saving wishlist:', error);
      return false;
    }
  },

  // Get wishlist from Firestore
  async getWishlist(userId) {
    try {
      var doc = await db.collection('wishlists').doc(userId).get();

      if (doc.exists) {
        return doc.data().items || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return [];
    }
  },

  // ── NEWSLETTER ───────────────────────────

  // Save newsletter subscriber
  async saveSubscriber(email) {
    try {
      await db.collection('subscribers').doc(email).set({
        email:       email,
        subscribedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error saving subscriber:', error);
      return false;
    }
  },

  // ── REVIEWS ──────────────────────────────

  // Save a product review
  async saveReview(productId, review) {
    try {
      await db.collection('reviews').add({
        productId:  productId,
        userId:     review.userId,
        userName:   review.userName,
        rating:     review.rating,
        comment:    review.comment,
        date:       new Date().toISOString(),
        verified:   review.verified || false
      });

      return true;
    } catch (error) {
      console.error('Error saving review:', error);
      return false;
    }
  },

  // Get reviews for a product
  async getReviews(productId) {
    try {
      var snapshot = await db.collection('reviews')
        .where('productId', '==', productId)
        .orderBy('date', 'desc')
        .get();

      var reviews = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        data.id  = doc.id;
        reviews.push(data);
      });

      return reviews;
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

};
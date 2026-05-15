// ============================================
// AUTH MANAGER
// Handles user login, register, logout
// ============================================

var AuthManager = {

  currentUser: null,

  // ── INITIALIZE ───────────────────────────

  init() {
    var self = this;

    // Listen for auth state changes
    // Fires whenever user logs in or out
    auth.onAuthStateChanged(function(user) {
      if (user) {
        self.currentUser = user;
        self.onUserLoggedIn(user);
      } else {
        self.currentUser = null;
        self.onUserLoggedOut();
      }
    });
  },

  // ── STATE CHANGES ─────────────────────────

  onUserLoggedIn(user) {
    // Update UI to show logged in state
    this.updateAuthUI(true, user);

    // Sync wishlist from Firestore
    this.syncWishlistFromFirestore(user.uid);

    console.log('User logged in:', user.email);
  },

  onUserLoggedOut() {
    // Update UI to show logged out state
    this.updateAuthUI(false, null);

    console.log('User logged out');
  },

  // ── REGISTER ─────────────────────────────

  async register(email, password, name) {
    try {
      var result = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      // Update display name
      await result.user.updateProfile({
        displayName: name
      });

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // ── LOGIN ─────────────────────────────────

  async login(email, password) {
    try {
      var result = await auth.signInWithEmailAndPassword(
        email,
        password
      );

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // ── GOOGLE LOGIN ──────────────────────────

  async loginWithGoogle() {
    try {
      var provider = new firebase.auth.GoogleAuthProvider();
      var result   = await auth.signInWithPopup(provider);

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // ── LOGOUT ───────────────────────────────

  async logout() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ── PASSWORD RESET ────────────────────────

  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // ── HELPERS ──────────────────────────────

  isLoggedIn() {
    return this.currentUser !== null;
  },

  getUser() {
    return this.currentUser;
  },

  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  },

  getUserName() {
    if (!this.currentUser) return null;
    return this.currentUser.displayName || this.currentUser.email;
  },

  getUserEmail() {
    return this.currentUser ? this.currentUser.email : null;
  },

  // ── WISHLIST SYNC ─────────────────────────

  async syncWishlistFromFirestore(userId) {
    var firestoreWishlist = await FirestoreManager.getWishlist(userId);
    var localWishlist     = StorageManager.getWishlist();

    // Merge both wishlists
    var merged = [...new Set([...localWishlist, ...firestoreWishlist])];

    // Save merged to both places
    StorageManager.saveWishlist(merged);
    await FirestoreManager.saveWishlist(userId, merged);

    // Update badge
    if (typeof App !== 'undefined') {
      App.updateWishlistBadge();
    }
  },

  async syncWishlistToFirestore() {
    if (!this.isLoggedIn()) return;

    var wishlist = StorageManager.getWishlist();
    await FirestoreManager.saveWishlist(this.getUserId(), wishlist);
  },

  // ── UI UPDATES ────────────────────────────

  updateAuthUI(isLoggedIn, user) {
    var loginBtns   = document.querySelectorAll('.auth-login-btn');
    var logoutBtns  = document.querySelectorAll('.auth-logout-btn');
    var userNameEls = document.querySelectorAll('.auth-user-name');
    var authSections = document.querySelectorAll('.auth-only');
    var guestSections = document.querySelectorAll('.guest-only');

    if (isLoggedIn && user) {
      // Show logged in state
      loginBtns.forEach(function(btn) {
        btn.style.display = 'none';
      });

      logoutBtns.forEach(function(btn) {
        btn.style.display = 'flex';
      });

      userNameEls.forEach(function(el) {
        el.textContent = user.displayName || user.email;
      });

      authSections.forEach(function(el) {
        el.style.display = 'block';
      });

      guestSections.forEach(function(el) {
        el.style.display = 'none';
      });

    } else {
      // Show logged out state
      loginBtns.forEach(function(btn) {
        btn.style.display = 'flex';
      });

      logoutBtns.forEach(function(btn) {
        btn.style.display = 'none';
      });

      authSections.forEach(function(el) {
        el.style.display = 'none';
      });

      guestSections.forEach(function(el) {
        el.style.display = 'block';
      });
    }
  },

  // ── ERROR MESSAGES ────────────────────────

  getErrorMessage(code) {
    var messages = {
      'auth/email-already-in-use':    'An account with this email already exists',
      'auth/invalid-email':           'Please enter a valid email address',
      'auth/weak-password':           'Password must be at least 6 characters',
      'auth/user-not-found':          'No account found with this email',
      'auth/wrong-password':          'Incorrect password',
      'auth/too-many-requests':       'Too many attempts. Please try again later',
      'auth/network-request-failed':  'Network error. Check your connection',
      'auth/popup-closed-by-user':    'Login cancelled',
      'auth/cancelled-popup-request': 'Login cancelled'
    };

    return messages[code] || 'Something went wrong. Please try again';
  }

};
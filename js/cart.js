
// ============================================
// CART SYSTEM
// ============================================

const Cart = {

  items: [],
  listeners: [],

  init() {
    this.items = StorageManager.getCart();
    this.updateCartBadge();
  },

  onChange(callback) {
    this.listeners.push(callback);
  },

  notify() {
    StorageManager.saveCart(this.items);
    this.updateCartBadge();
    this.listeners.forEach(callback => callback(this.items, this.getSummary()));
  },

  addItem(product, quantity, variant) {
    if (quantity === undefined) quantity = 1;
    if (variant === undefined) variant = null;

    const existingIndex = this.items.findIndex(item =>
      item.productId === product.id &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingIndex > -1) {
      const newQty = this.items[existingIndex].quantity + quantity;

      if (newQty > product.stock) {
        this.showNotification('Only ' + product.stock + ' available in stock', 'warning');
        return false;
      }

      this.items[existingIndex].quantity = newQty;

    } else {
      if (quantity > product.stock) {
        this.showNotification('Not enough stock available', 'error');
        return false;
      }

      this.items.push({
        productId:     product.id,
        name:          product.name,
        price:         product.onSale ? product.salePrice : product.price,
        originalPrice: product.price,
        image:         product.images[0],
        quantity:      quantity,
        variant:       variant,
        stock:         product.stock
      });
    }

    this.notify();
    this.showNotification(product.name + ' added to cart!', 'success');
    return true;
  },

  removeItem(productId, variant) {
    if (variant === undefined) variant = null;

    this.items = this.items.filter(item =>
      !(item.productId === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant))
    );
    this.notify();
    this.showNotification('Item removed from cart', 'info');
  },

  updateQuantity(productId, quantity, variant) {
    if (variant === undefined) variant = null;

    const item = this.items.find(item =>
      item.productId === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (!item) return;

    if (quantity <= 0) {
      this.removeItem(productId, variant);
      return;
    }

    if (quantity > item.stock) {
      this.showNotification('Only ' + item.stock + ' available in stock', 'warning');
      return;
    }

    item.quantity = quantity;
    this.notify();
  },

  clear() {
    this.items = [];
    this.notify();
  },

  getItems() {
    return this.items;
  },

  getItemCount() {
    return this.items.reduce(function(total, item) {
      return total + item.quantity;
    }, 0);
  },

  isEmpty() {
    return this.items.length === 0;
  },

  getSummary() {
    var subtotal = 0;
    var savings = 0;

    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      subtotal += item.price * item.quantity;

      if (item.originalPrice > item.price) {
        savings += (item.originalPrice - item.price) * item.quantity;
      }
    }

    return {
      subtotal:  subtotal,
      savings:   savings,
      itemCount: this.getItemCount()
    };
  },

  formatPrice(amount) {
    return '₦' + amount.toLocaleString('en-NG');
  },

  updateCartBadge() {
    var count = this.getItemCount();
    var badges = document.querySelectorAll('.cart-badge');

    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = count;
      badges[i].style.display = count > 0 ? 'flex' : 'none';
    }
  },

  buildWhatsAppMessage(customerDetails) {
    var summary = this.getSummary();
    var itemsList = '';

    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      var variant = '';

      if (item.variant) {
        var variantValues = [];
        for (var key in item.variant) {
          variantValues.push(item.variant[key]);
        }
        variant = ' (' + variantValues.join(', ') + ')';
      }

      itemsList += '• ' + item.name + variant + ' x' + item.quantity + ' — ' + this.formatPrice(item.price * item.quantity) + '\n';
    }

    var message = '';
    message += 'Hello! I\'d like to place an order 🛍️\n';
    message += '\n';
    message += 'ORDER #ORD-' + Date.now() + '\n';
    message += '─────────────────\n';
    message += itemsList;
    message += '─────────────────\n';
    message += 'Subtotal: ' + this.formatPrice(summary.subtotal) + '\n';
    message += 'Shipping: To be confirmed\n';
    message += '\n';
    message += 'CUSTOMER DETAILS\n';
    message += 'Name: ' + customerDetails.name + '\n';
    message += 'Phone: ' + customerDetails.phone + '\n';
    message += 'Email: ' + customerDetails.email + '\n';
    message += '\n';
    message += 'DELIVERY LOCATION\n';

    if (customerDetails.state) {
      message += 'State: ' + customerDetails.state + '\n';
    }

    if (customerDetails.city) {
      message += 'City: ' + customerDetails.city + '\n';
    }

    if (customerDetails.landmark) {
      message += 'Landmark: ' + customerDetails.landmark + '\n';
    }

    if (customerDetails.description && customerDetails.description.length > 0) {
      message += 'How to find me: ' + customerDetails.description + '\n';
    }

    if (customerDetails.notes && customerDetails.notes.length > 0) {
      message += '\nOrder Notes: ' + customerDetails.notes + '\n';
    }

    message += '\n';
    message += 'Please confirm my order and\n';
    message += 'let me know the delivery fee.\n';
    message += 'Thank you! 🙏';

    return encodeURIComponent(message);
  },

  sendWhatsAppOrder(customerDetails, whatsappNumber) {
    var message = this.buildWhatsAppMessage(customerDetails);
    var url = 'https://wa.me/' + whatsappNumber + '?text=' + message;
    window.open(url, '_blank');
  },

  showNotification(message, type) {
    if (type === undefined) type = 'info';

    var container = document.querySelector('.notification-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    var notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.innerHTML = '<div class="notification-content">' +
      '<span class="notification-icon">' + this.getNotificationIcon(type) + '</span>' +
      '<span class="notification-message">' + message + '</span>' +
      '</div>' +
      '<button class="notification-close">×</button>';

    var closeBtn = notification.querySelector('.notification-close');
    var self = this;

    closeBtn.addEventListener('click', function() {
      self.dismissNotification(notification);
    });

    container.appendChild(notification);

    setTimeout(function() {
      notification.classList.add('show');
    }, 10);

    setTimeout(function() {
      self.dismissNotification(notification);
    }, 3000);
  },

  dismissNotification(notification) {
    notification.classList.remove('show');

    setTimeout(function() {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  },

  getNotificationIcon(type) {
    if (type === 'success') return '✓';
    if (type === 'error')   return '✕';
    if (type === 'warning') return '⚠';
    return 'ℹ';
  }

};
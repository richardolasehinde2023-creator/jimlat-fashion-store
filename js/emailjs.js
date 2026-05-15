// ============================================
// EMAILJS MANAGER
// Sends order confirmation emails
// ============================================

// Initialize EmailJS with your public key
emailjs.init('VQ3YKAJ-4MCY6orG_');

var EmailManager = {

  SERVICE_ID:  'service_lm4z389',
  TEMPLATE_ID: 'template_1fzew38',

  // ── SEND ORDER CONFIRMATION ───────────────

  async sendOrderConfirmation(order) {
    try {
      // Build items list for email
      var itemsList = '';
      for (var i = 0; i < order.items.length; i++) {
        var item    = order.items[i];
        var variant = '';

        if (item.variant) {
          var vals = [];
          for (var key in item.variant) {
            vals.push(item.variant[key]);
          }
          variant = ' (' + vals.join(', ') + ')';
        }

        itemsList += '• ' + item.name + variant
          + ' x' + item.quantity
          + ' — ' + Cart.formatPrice(item.price * item.quantity)
          + '\n';
      }

      // Build template parameters
      // These match the {{variables}}
      // in your EmailJS template
      var templateParams = {
        customer_name:     order.customer.name,
        customer_email:    order.customer.email,
        customer_phone:    order.customer.phone,
        customer_state:    order.customer.state,
        customer_city:     order.customer.city,
        customer_landmark: order.customer.landmark,
        order_id:          order.id,
        order_items:       itemsList,
        subtotal:          Cart.formatPrice(order.summary.subtotal)
      };

      // Send the email
      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );

      console.log('Order confirmation email sent');
      return true;

    } catch (error) {
      console.error('Email failed:', error);
      // Don't stop the order process
      // if email fails
      // Order is still saved
      return false;
    }
  },

  // ── SEND CONTACT FORM ─────────────────────

  async sendContactMessage(details) {
    try {
      var templateParams = {
        customer_name:    details.name,
        customer_email:   details.email,
        contact_subject:  details.subject,
        contact_message:  details.message
      };

      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );

      return true;
    } catch (error) {
      console.error('Contact email failed:', error);
      return false;
    }
  }

};
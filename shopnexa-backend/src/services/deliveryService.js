import supabase from '../config/supabaseClient.js';
import bus from '../events/eventBus.js';

// Placeholder email/SMS sender. In production integrate with providers (SendGrid/Twilio etc.)
export async function sendDeliveryConfirmation(order) {
  try {
    const userId = order.user_id;
    // Fetch user email if available
    let email = null;
    if (userId) {
      const { data: users, error } = await supabase.from('users').select('id,email').eq('id', userId).limit(1);
      if (!error && users && users.length) email = users[0].email;
    }
    // Simulate sending
    console.log(`[DELIVERY-CONFIRM] Order ${order.id} completed. Email:${email||'N/A'} SMS: (stub)`);
    // Broadcast confirmation event for frontend dashboards
    bus.emit('delivery-confirmed', { id: order.id, email });
  } catch (e) {
    console.warn('Failed delivery confirmation stub', e.message || e);
  }
}

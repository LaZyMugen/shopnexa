import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Ensure secret key exists
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null;

router.post('/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe secret key not configured' });
  try {
    const { orderId, amount, currency = 'inr', email } = req.body;
    // Always compute amount on server (trusted) – fallback to minimal validation
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `ShopNexa Order #${orderId || 'demo'}`,
              description: 'Demo purchase via Stripe Checkout',
            },
            unit_amount: amount, // smallest currency unit (paise for INR)
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/stripe/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/stripe/cancel',
      metadata: { orderId: orderId || 'demo' },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe session error', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/session/:id', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe secret key not configured' });
  try {
    const sess = await stripe.checkout.sessions.retrieve(req.params.id);
    return res.json(sess);
  } catch (e) {
    return res.status(404).json({ error: 'Session not found' });
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { handlePaymentIntentSucceeded } from '../services/donation.service';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Must receive raw body for signature verification.
 * Mount with express.raw({ type: 'application/json' }) before express.json().
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestError('Webhook secret not configured');
    }

    const rawBody = req.body as Buffer;
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestError('Missing Stripe signature');
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      throw new BadRequestError('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;

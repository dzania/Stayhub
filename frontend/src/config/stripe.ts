import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key (safe to expose in frontend)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RXJKPQKzm4O0G3i9t6Jjd8u2V9f9LStQAyBXTbUmsTLzu8nK846yiQJ2MwtiAchJm94fw3nis7YiBpuuXMUyFHi00rKVIyieM';

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default stripePromise; 
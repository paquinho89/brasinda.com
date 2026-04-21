
import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Use Vite environment variable for Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

const InfoPagamento: React.FC = () => {
  useEffect(() => {
    let stripe: any;
    let checkout: any;

    const initializeStripe = async () => {
      stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      if (!stripe) {
        alert('Stripe failed to load.');
        return;
      }

      // Function to fetch clientSecret from backend
      const fetchClientSecret = async () => {
        // TODO: Replace with actual price_id and quantity
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/eventos/stripe/create-checkout-session/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              price_id: 'price_1TObTV0RLX7cRO1hKLYsYRDp', // ⚠️ Cambia esto por un Price ID real de Stripe
              quantity: 1,
              mode: 'payment',
            }),
          }
        );
        const data = await response.json();
        return data.clientSecret;
      };

      // Stripe Embedded Checkout
      // @ts-ignore
      checkout = await stripe.createEmbeddedCheckoutPage({
        fetchClientSecret,
      });
      checkout.mount('#checkout');
    };

    initializeStripe();

    return () => {
      // Optionally, cleanup
      if (checkout && checkout.unmount) checkout.unmount();
    };
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <h2>Pagamento seguro</h2>
      <div id="checkout">
        {/* Stripe Embedded Checkout will mount here */}
      </div>
    </div>
  );
};

export default InfoPagamento;

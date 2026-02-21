# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Stripe (organization one-time payment, $1000)

- Get **Secret key** and **Publishable key** from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys).
- Product and price were created via Stripe MCP. Use the **Price ID** for the $1000 one-time product.
- Set in `.env`:
  - `STRIPE_SECRET_KEY` — secret key (e.g. `sk_test_...`)
  - `STRIPE_PUBLISHABLE_KEY` — publishable key (e.g. `pk_test_...`)
  - `STRIPE_PRICE_ID` — one-time price ID (e.g. `price_1T3MOMRhXWL1ZXjfhYr0TY97`)
  - `STRIPE_WEBHOOK_SECRET` — for local testing run `stripe listen --forward-to localhost:3333/webhooks/stripe` and use the signing secret the CLI prints; for production use the secret from Dashboard → Developers → Webhooks (endpoint: `POST /webhooks/stripe`)

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

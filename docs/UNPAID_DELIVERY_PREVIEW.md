# NISRIN unpaid delivery test — NOT checkout

This frontend feature is deliberately available only when **both** `import.meta.env.DEV` and `VITE_NISRIN_ENABLE_DRAFT_CHECKOUT=true`. The page may only reserve SKU stock briefly and is not a completed order or a payment screen.

## Dependency chain

- Frontend PR #22 (server shipping quote preview) → this branch.
- Backend PR #21 (server shipping quote) → PR #22 (temporary delivery snapshot) → PR #23 (atomic delivery address deletion after cancel/expiry).

## Development-only flow

1. Select products from approved API catalog, then request a server-priced unpaid draft (15 minute expiry).
2. Request shipping price by Norwegian postal code.
3. Using **synthetic test data only**, provide name, street, optional extra address and city. Postal code is inherited from the server quote.
4. POST `/order-drafts/delivery` with the original request key and matching email, then show only the **server-validated** acknowledgement and amount. This is neither a payment nor a confirmed order.
5. Explicitly cancel to release inventory and remove temporary delivery data. Backend expiry worker must be configured and verified to handle abandoned drafts.

## Launch blockers

- **Do not open this feature to customers.** Real MariaDB schema, migrations, authorization, frontend/backend integration, server delivery/retention policy, privacy notices and backups must be reviewed.
- Backend PR #23 deletes temporary addresses during cancel/expiry, but the existing draft table retains contact emails after terminal state. A complete retention/redaction solution remains necessary.
- Current API only permits Origin `https://nisrin.no` and `https://www.nisrin.no`; running Vite on localhost will not complete the real API flow without an explicitly reviewed isolated test origin/proxy. Do **not** open CORS broadly to bypass this.
- Configure approved shipping prices and supported zones. No payment provider, verifiable payment webhook, order acceptance, email confirmation or return-policy publication is present.
- No frontend PRs are merged into main; no Vercel/VPS/database deployment is performed here.

## Offline tests

`node --test tests/unpaid-delivery.test.mjs` exercises strict address byte lengths, leading-zero postcodes, server acknowledgement and rejection of fake paid states. Frontend CI also runs the normal TypeScript production build and lint.

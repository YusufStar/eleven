import { Elysia } from "elysia";
import Stripe from "stripe";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" }) : null;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

export const stripeWebhookApp = new Elysia({ prefix: "/webhooks" })
  .onParse(async ({ request }) => {
    const arrayBuffer = await Bun.readableStreamToArrayBuffer(request.body!);
    return Buffer.from(arrayBuffer);
  })
  .post("/stripe", async ({ body, headers, set }) => {
    if (!STRIPE_WEBHOOK_SECRET || !stripe) {
      set.status = 500;
      return { message: "Webhook not configured" };
    }
    const rawBody = body instanceof Buffer ? body : Buffer.from(body as ArrayBuffer);
    const sig = headers["stripe-signature"] ?? headers["Stripe-Signature"];
    if (!sig) {
      set.status = 400;
      return { message: "Missing stripe-signature" };
    }
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[stripe webhook]", err instanceof Error ? err.message : err);
      set.status = 400;
      return { message: "Webhook signature verification failed" };
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      if (organizationId) {
        try {
          await prisma.organization.update({
            where: { id: organizationId },
            data: { paidAt: new Date() },
          });
        } catch (e) {
          console.error("[stripe webhook] org update failed", e);
        }
      }
    }
    return { received: true };
  });

export const paymentsRoutes = new Elysia({ prefix: "/payments" })
  .use(authPlugin)
  .get("/config", () => {
    return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "" };
  })
  .get(
    "/active-org-status",
    async ({ activeOrganization }) => {
      return {
        plan: activeOrganization!.plan,
        paidAt: activeOrganization!.paidAt,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/create-checkout-session",
    async ({ body, user, set }) => {
      const organizationId = (body as { organizationId?: string })?.organizationId;
      if (!organizationId || !stripe || !STRIPE_PRICE_ID) {
        set.status = 400;
        return { message: "organizationId required or Stripe not configured" };
      }
      const org = await prisma.organization.findFirst({
        where: { id: organizationId, members: { some: { userId: user!.id } } },
      });
      if (!org) {
        set.status = 404;
        return { message: "Organization not found or access denied" };
      }
      if (org.paidAt) {
        set.status = 400;
        return { message: "Organization already paid" };
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${FRONTEND_URL}/?payment=success`,
        cancel_url: `${FRONTEND_URL}/?payment=cancel`,
        client_reference_id: organizationId,
        customer_email: user!.email,
      });
      return { url: session.url };
    },
    { requireAuth: true }
  );

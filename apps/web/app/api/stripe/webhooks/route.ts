/*
<ai_context>
This API route handles Stripe webhook events to manage subscription status changes and updates user profiles accordingly.
</ai_context>
*/

// import {
//   manageSubscriptionStatusChange,
//   updateStripeCustomer
// } from "@/actions/stripe-actions"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import Stripe from "stripe"

// Events that will be handled once subscription persistence is implemented
// const relevantEvents = new Set([
//   "checkout.session.completed",
//   "customer.subscription.updated",
//   "customer.subscription.deleted"
// ])

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get("Stripe-Signature") as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  try {
    if (!sig || !webhookSecret) {
      throw new Error("Webhook secret or signature missing")
    }

    // Verify signature even though events are not processed yet
    stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // TODO: Implement subscription persistence when payments are MVP
  // Currently no-op — events are acknowledged but not processed
  return new Response(JSON.stringify({ received: true }))
}

// TODO: Implement these functions with Supabase when database actions are added back

// async function handleSubscriptionChange(event: Stripe.Event) {
//   const subscription = event.data.object as Stripe.Subscription
//   const productId = subscription.items.data[0].price.product as string
//   await manageSubscriptionStatusChange(
//     subscription.id,
//     subscription.customer as string,
//     productId
//   )
// }

// async function handleCheckoutSession(event: Stripe.Event) {
//   const checkoutSession = event.data.object as Stripe.Checkout.Session
//   if (checkoutSession.mode === "subscription") {
//     const subscriptionId = checkoutSession.subscription as string
//     await updateStripeCustomer(
//       checkoutSession.client_reference_id as string,
//       subscriptionId,
//       checkoutSession.customer as string
//     )

//     const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
//       expand: ["default_payment_method"]
//     })

//     const productId = subscription.items.data[0].price.product as string
//     await manageSubscriptionStatusChange(
//       subscription.id,
//       subscription.customer as string,
//       productId
//     )
//   }
// }

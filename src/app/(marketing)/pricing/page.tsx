import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { listPlans } from "@/lib/data/catalog";
import { cn } from "@/lib/cn";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pricing and membership",
  description: "Learn German free, or upgrade to Premium and Premium Plus for the full vocabulary library, grammar, stories, listening and AI conversation practice.",
  alternates: { canonical: "/pricing" },
};

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export default async function PricingPage() {
  const plans = await listPlans();

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Upgrade when you are ready."
        intro="The free plan is a real way to learn, not a trial. Premium plans unlock the full library and AI practice."
      />
      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
            const highlighted = plan.tier === "premium";
            const priced = plan.price_inr_month != null;
            return (
              <Card key={plan.id} className={cn("flex flex-col p-7", highlighted && "border-accent ring-1 ring-accent")}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">{plan.name}</h2>
                  {highlighted && <Badge tone="accent">Most popular</Badge>}
                </div>
                <p className="mt-2 text-sm text-ink-soft">{plan.description}</p>
                <div className="mt-6 min-h-16">
                  {plan.tier === "free" ? (
                    <p className="font-display text-4xl">₹0</p>
                  ) : priced ? (
                    <p className="font-display text-4xl">
                      {formatInr(plan.price_inr_month!)}
                      <span className="text-base text-muted"> / month</span>
                    </p>
                  ) : (
                    <p className="text-lg text-muted">Pricing announced soon</p>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" className="mt-0.5 shrink-0 text-success" aria-hidden>
                        <path d="M4 9.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                      </svg>
                      <span className="text-ink-soft">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.tier === "free" ? (
                    <ButtonLink href="/register" className="w-full">
                      Create free account
                    </ButtonLink>
                  ) : (
                    <ButtonLink href="/contact?topic=membership" variant={highlighted ? "primary" : "secondary"} className="w-full">
                      Join the waiting list
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        {plans.length === 0 && <Card className="p-10 text-center text-ink-soft">Membership plans are being finalised.</Card>}
        <p className="mt-10 max-w-2xl text-sm text-muted">
          Payments in India will be processed by Razorpay (UPI, cards, net banking) and internationally by Stripe. Online
          payments are not open yet. Join the waiting list and we will let you know when they are.
        </p>
      </Section>
    </>
  );
}

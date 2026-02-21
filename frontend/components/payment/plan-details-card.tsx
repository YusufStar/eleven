"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paymentsApi } from "@/services/payments";
import { PRODUCT, FEATURES, PLAN_NAMES } from "@/lib/product";

const PLAN = {
  name: PLAN_NAMES.PROFESSIONAL,
  price: "$1,000",
  priceNote: "one-time",
};

export function PlanDetailsCard({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { url } = await paymentsApi.createCheckoutSession(organizationId);
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="space-y-1">
        <CardTitle>{PLAN.name}</CardTitle>
        <CardDescription>{PRODUCT.tagline}</CardDescription>
        <p className="text-sm text-muted-foreground pt-1">{PRODUCT.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-2xl font-semibold">{PLAN.price}</p>
          <p className="text-xs text-muted-foreground">{PLAN.priceNote}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-2">What you get</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {FEATURES.map(({ area }) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePay} disabled={loading} className="w-full">
          {loading ? "Redirecting…" : "Pay now"}
        </Button>
      </CardFooter>
    </Card>
  );
}

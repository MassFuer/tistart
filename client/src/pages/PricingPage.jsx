import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Shield, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { Badge } from "@/components/ui/badge";

const PricingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' | 'yearly'

  const plans = [
    {
      name: "Free",
      description: "Essential tools for newcomers.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Up to 5GB Upload Storage",
        "Access to public events",
        "View public artworks",
        "Community support",
        "Basic profile",
      ],
      notIncluded: [
        "Private events access",
        "Bid on auctions",
        "Advanced analytics",
        "4K Video streaming",
      ],
      icon: Shield,
      tier: "free",
      color: "bg-slate-100 dark:bg-slate-800",
    },
    {
      name: "Premium",
      description: "For serious art enthusiasts.",
      price: { monthly: 15, yearly: 150 },
      features: [
        "Up to 50GB Upload Storage",
        "Everything in Free",
        "Exclusive private events",
        "Stream up to 1000 mins/mo",
        "Priority support",
        "Verified badge eligibility",
      ],
      notIncluded: [
         "Bid on exclusive auctions",
         "Enterprise API access",
         "Dedicated account manager",
      ],
      icon: Zap,
      tier: "pro",
      popular: true,
      color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    },
    {
      name: "Max",
      description: "Ultimate access & volume.",
      price: { monthly: 49, yearly: 490 },
      features: [
        "Up to 200GB Upload Storage",
        "Everything in Premium",
        "Bid on ALL auctions",
        "Unlimited video streaming",
        "Dedicated account manager",
        "Early access to drops",
      ],
      notIncluded: [],
      icon: Crown,
      tier: "enterprise",
      color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    },
  ];

  const handleSubscribe = (plan) => {
    // In a real app, this would redirect to Stripe Checkout
    console.log("Subscribe to:", plan.name);
    // Redirect logic goes here
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that's right for you. Whether you're just browsing or a serious collector/artist.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
            <span className={billingCycle === "monthly" ? "font-bold text-foreground" : "text-muted-foreground"}>Monthly</span>
            <div 
                className="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer px-1 flex items-center transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
                onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
            >
                <div 
                    className={`w-6 h-6 bg-background rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                        billingCycle === "yearly" ? "translate-x-6" : ""
                    }`} 
                />
            </div>
            <span className={billingCycle === "yearly" ? "font-bold text-foreground" : "text-muted-foreground"}>
                Yearly <span className="text-xs text-green-600 font-medium ml-1">(-20%)</span>
            </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = isAuthenticated && user.subscriptionTier === plan.tier;
          const Icon = plan.icon;

          return (
            <Card 
                key={plan.name} 
                className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg scale-105 z-10" : ""} ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary dark:bg-slate-100/20 dark:text-slate-100 shadow-sm dark:border-slate-200">
                    <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                        {plan.price[billingCycle] === 0 ? "Free" : `€${plan.price[billingCycle]}`}
                    </span>
                    {plan.price[billingCycle] > 0 && (
                        <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    )}
                </div>

                <ul className="space-y-3">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 shrink-0" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                    {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-muted-foreground/60">
                            <X className="h-5 w-5 shrink-0" />
                            <span className="text-sm line-through">{feature}</span>
                        </li>
                    ))}
                </ul>
              </CardContent>

              <CardFooter>
                 {isCurrentPlan ? (
                    <Button className="w-full" disabled variant="outline">Current Plan</Button>
                 ) : (
                    <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan)}
                    >
                        {plan.price.monthly === 0 ? "Get Started" : `Upgrade to ${plan.name}`}
                    </Button>
                 )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPage;
